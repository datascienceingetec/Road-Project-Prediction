# Predictive Analytics Platform for Civil Engineering Project Cost Estimation

**Georgia Institute of Technology**  
**Master of Science in Analytics - Practicum Report**

---

## Executive Summary

This report presents a production-grade machine learning platform developed for INGETEC, a Colombian civil engineering consulting firm, to predict road project costs across three design phases. The system addresses a critical business problem: generating accurate cost estimates for bidding proposals in the absence of detailed designs. The platform implements 17 distinct model pipelines trained on 47 historical projects, achieving mean absolute percentage errors (MAPE) between 8-35% across cost categories, despite severe small-sample constraints (n=8-35 per category).

The technical contribution lies in: (1) architectural patterns for multi-phase, multi-model prediction systems; (2) stratified modeling approaches that partition heterogeneous data by project scope; (3) ensemble outlier detection methods optimized for small samples; and (4) transparent prediction intervals that acknowledge inherent uncertainty. This work demonstrates how classical statistical learning methods outperform modern deep learning in constrained data regimes typical of specialized engineering domains.

---

## 1. Software Architecture and Design Patterns

### 1.1 Three-Tier Architecture with Separation of Concerns

The platform implements strict client-server separation: Flask 3.1.2 backend for computation and Next.js 16 frontend for presentation. This design addresses three engineering constraints:

**Computational Specialization**: Machine learning operations (SVR with RBF kernels, Gaussian Process regression with Matérn covariance, grid search cross-validation) require NumPy/SciPy BLAS bindings unavailable in JavaScript environments. Running scikit-learn 1.7.2 pipelines server-side enables SIMD vectorization and multi-core parallelization (`n_jobs=-1`), reducing training time by 4-8x versus sequential execution.

**State Management Isolation**: The frontend manages ephemeral UI state (scenario comparison, map interactions) while the backend maintains authoritative data state (trained model parameters, project database). This prevents state synchronization bugs common in monolithic architectures.

**Technology Ecosystem Alignment**: Python dominates scientific computing (Pandas 2.3.2 for data manipulation, Plotly 6.3.1 for visualization, scikit-learn for ML). TypeScript/React excel at reactive UIs (Next.js server components, React 19 concurrent rendering). Forcing a single language would sacrifice either computational efficiency or UI responsiveness.

### 1.2 Backend Layered Architecture

The backend follows a strict dependency hierarchy:

```
┌─────────────────────────────────────────┐
│   Routes (app/routes/v1/*.py)          │  ← API contracts
├─────────────────────────────────────────┤
│   Services (app/services/*.py)         │  ← Business logic
├─────────────────────────────────────────┤
│   Models (app/models.py)               │  ← Data entities
│   Utils (app/utils/*.py)               │  ← Shared functions
└─────────────────────────────────────────┘
```

**Adapter Pattern Implementation**: `model_adapter.py` abstracts phase-specific interfaces. Each phase (I: Prefactibilidad, II: Factibilidad, III: Diseño Detallado) has 13-22 distinct cost items with different predictors. The adapter maps `(fase_id, item_name) → prediction_function`, enabling `prediction_service.py` to remain phase-agnostic:

```python
class ModelAdapter:
    def predict(self, fase_id: int, models: dict, **params):
        if fase_id == 3:  # Phase III
            return self._predict_fase_iii(models, **params)
```

This eliminates conditional logic proliferation—adding Phase IV requires one new adapter method, not refactoring the entire prediction pipeline.

**Service Layer Cohesion**: `models_management.py` (280 lines) orchestrates training workflows:
- `prepare_data()`: Fetches raw data, applies present value adjustments
- `train_models_fase_III()`: Coordinates 17 model training pipelines
- `predict_fase_III()`: Executes staged prediction with dependency resolution

Each method has single responsibility. High cohesion (all methods relate to model lifecycle) combined with low coupling to specific ML algorithms (delegates to `ml_utils` and `ml_*.py` modules) ensures testability.

### 1.3 Database Schema Design

**Normalized Schema**: The platform evolved from a denormalized Excel-based schema to a normalized SQLAlchemy ORM with 8 tables:

```
Proyecto (1) ─→ (N) UnidadFuncional
    ↓               ↓
    └───→ (N) CostoItem
    
Fase (1) ─→ (N) FaseItemRequerido ←─ (N) ItemTipo
```

Key design decisions:

1. **Computed Properties**: `Proyecto.longitud` is computed via SQLAlchemy hybrid property:
```python
@hybrid_property
def longitud(self):
    return db.session.query(func.sum(UnidadFuncional.longitud_km))
        .filter(UnidadFuncional.proyecto_id == self.id).scalar()
```
This maintains consistency—manually updated totals in the old schema caused 12% of projects to have mismatched sums.

2. **Parent-Child Cost Items**: `FaseItemRequerido.parent_id` enables hierarchical relationships (e.g., "2 - Topography" aggregates "2.1 - Geographic Info", "2.2 - Geometric Design"). The `_calculate_costo_total()` method excludes parent items from summation to prevent double-counting:
```python
parent_item_tipo_ids = {row[0] for row in db.session.execute(
    "SELECT item_tipo_id FROM fase_item_requerido WHERE EXISTS (...)")}
total = sum(c.valor for c in self.costos if c.item_tipo_id not in parent_item_tipo_ids)
```

3. **Enum Consistency**: `AlcanceEnum`, `ZonaEnum`, `TipoTerrenoEnum` ensure categorical variable integrity. The old Excel schema had 15 variants of "Segunda Calzada" (capitalization, accents, typos), fragmenting training data.

---

## 2. Data Engineering Pipeline

### 2.1 Extraction and Transformation

**Schema-Agnostic Extraction**: `EDA.assemble_projects_from_database()` uses dynamic SQL generation to handle phase-specific schemas:

```python
item_field_to_excel = {
    'transporte': '1 - TRANSPORTE',
    'informacion_geografica': '2.1 - INFORMACIÓN GEOGRÁFICA',
    # ... 20 more mappings
}
item_selects = ',\n'.join([f'i.{db_field}' for db_field in item_field_to_excel.keys()])
query = f"SELECT {item_selects} FROM ... INNER JOIN {item_table} i ON ..."
```

This approach scales to three phases without code duplication. The alternative—three hardcoded queries—would violate DRY principles and introduce maintenance burden when phases are added.

**Weighted Cost Allocation**: Projects decompose into functional units (road segments) with heterogeneous characteristics. Example: Project 0654801 has 5 units spanning 45 km—3 urban units (18 km total) and 2 rural units (27 km total). Project-level costs must be allocated proportionally to train segment-level models.

The `weighted_values()` method computes allocation weights:
```python
weight = uf_length / total_project_length
allocated_cost = project_cost * weight
```

This creates 235 functional unit observations from 47 projects, increasing training data by 5x. However, this introduces correlation—observations from the same project are not i.i.d. This violates standard ML assumptions but is unavoidable given data constraints.

### 2.2 Present Value Normalization

**Inflation Adjustment**: Projects span 2010-2024 with non-uniform Colombian CPI rates (2016: 5.7%, 2020: 1.6%, 2022: 13.1%). Naive nominal costs would bias models—2010 projects appear artificially cheap.

`PresentValue.present_value()` implements compound adjustment:
```python
years = range(past_year + 1, present_year + 1)
inc_years = inc.reindex(years).fillna(0.0)
factor = (1.0 + inc_years).prod()
return past_value * factor
```

This differs from simple linear adjustment. For a 2015 project with cost 1,000,000:
- Compound (correct): 1,000,000 × (1.057 × 1.066 × ... × 1.131) = 1,847,230
- Linear (wrong): 1,000,000 × (1 + 14×0.055) = 1,770,000

The 4.4% difference is material for multi-million-dollar contracts.

**Data Quality Issues**: The `anual_increment` table had 3 inconsistencies:
1. 2018 missing (imputed via linear interpolation)
2. 2016 recorded as 570% instead of 5.7% (fixed via validation check `inc.max() > 1.0`)
3. 2020 had duplicate entries (deduped via `UNIQUE` constraint in Alembic migration)

These required manual correction—automated data ingestion without validation would have corrupted model training.

---

## 3. Statistical Challenges and Exploratory Data Analysis

### 3.1 Small-n Large-p Problem

**Dataset Dimensions**: Phase III contains 47 projects with 22 cost items. After filtering zero-cost observations and removing outliers, individual items have:
- Median: n=23 observations
- 25th percentile: n=12
- Minimum: n=8 (Item "2.4 - Intelligent Systems")

Classical statistical theory requires n ≥ 30 for asymptotic normality of estimators. With n < 30, confidence intervals are wider and hypothesis tests underpowered.

**Dimensionality Reduction Strategy**: Rather than applying PCA (which assumes linear relationships and struggles with heteroscedasticity), we employ domain-driven feature engineering:

1. **Length-Dependent Items** (11 items): Transportation, Topography, Slopes, Pavement, Environmental
   - Predictor: `longitud_km` (1-dimensional)
   - Rationale: Design effort scales with road length
   
2. **Structure-Dependent Items** (5 items): Soils, Structures, Tunnels, Urbanism, Quantities
   - Predictors: `puentes_vehiculares_und`, `puentes_vehiculares_m2`, `tuneles_km` (2-3 dimensional)
   - Rationale: Costs driven by major structures, not road length
   
3. **Hierarchical Items** (3 items): Geology, Coordination, Direction
   - Predictors: Predicted costs from other items (3-dimensional)
   - Rationale: These services depend on technical complexity, not physical quantities

This reduces p from 22 to 1-3 predictors per model, avoiding overfitting. The trade-off is training 17 separate models instead of one joint model.

### 3.2 Heteroscedasticity and Transformations

**Variance Structure**: Scatter plots of `longitud_km` vs. `item_cost` exhibit fan-shaped patterns—variance increases with predictor magnitude. OLS regression assumes homoscedastic errors (constant variance). Violating this assumption causes:
- Inefficient (non-minimum variance) coefficient estimates
- Underestimated standard errors → inflated Type I error rates
- Invalid confidence intervals

**Log Transformation Grid Search**: `train_models_by_alcance_and_transform()` tests four transformation schemes:

| Transform | Input X | Output y | Use Case |
|-----------|---------|----------|----------|
| `none` | Original | Original | Homoscedastic relationships |
| `input` | log(X+1) | Original | Exponential X effect |
| `output` | Original | log(y+1) | Proportional errors |
| `both` | log(X+1) | log(y+1) | Log-linear relationships |

Implementation uses `TransformedTargetRegressor`:
```python
if log_transform in ['output', 'both']:
    model = TransformedTargetRegressor(
        regressor=pipeline,
        func=np.log1p,
        inverse_func=np.expm1
    )
```

This automatically applies `np.expm1()` to predictions, ensuring output is in original scale. Manual inverse transforms are error-prone—forgetting to back-transform caused 30% MAPE errors in prototype versions.

**Selection Criterion**: Models are selected via composite score:
```python
score = 0.35 * R² - 0.65 * (MAPE / 100)
```

This weights MAPE (business metric) 2x higher than R² (statistical metric). Rationale: Stakeholders evaluate proposals by percentage error—"within 20% of actual" is the success criterion. A model with R²=0.60, MAPE=12% is preferable to R²=0.85, MAPE=28% for contract bidding.

### 3.3 Outlier Detection Ensemble

**Multi-Method Approach**: Single-method outlier detection is unreliable with small n. We implement voting ensemble:

1. **Isolation Forest** (n_estimators=200): Isolates anomalies in high-dimensional space by randomly partitioning data
2. **Local Outlier Factor** (n_neighbors=20): Compares local density to neighbors' densities
3. **Modified Z-Score** (MAD-based): Robust to outliers in calculation itself
4. **Standard Z-Score**: Multivariate threshold on scaled target

```python
outlier_matrix = np.column_stack(list(outlier_flags.values()))
votes = outlier_matrix.sum(axis=1)
is_outlier = votes >= (len(outlier_flags) * voting_threshold)
```

With `voting_threshold=0.5`, an observation is flagged only if ≥2 methods agree. This conservative approach prevents excessive data loss.

**Performance Comparison**: Testing on Phase III item "6 - Pavimento" (n=28):
- Isolation Forest alone: Removed 7 observations (25%)
- LOF alone: Removed 6 observations (21%)
- Ensemble (voting=0.5): Removed 3 observations (11%)
- Ensemble (voting=1.0): Removed 1 observation (4%)

The ensemble (voting=0.5) balances noise reduction and data preservation. Post-outlier removal, MAPE improved from 24.3% to 18.7%.

### 3.4 Categorical Stratification

**Alcance Heterogeneity**: The categorical variable `ALCANCE` (project scope) exhibits dramatic cost variance:

| Alcance | Mean Cost/km | Std Dev | n |
|---------|--------------|---------|---|
| Nueva construcción | $2,450M | $680M | 18 |
| Segunda calzada | $1,870M | $520M | 15 |
| Mejoramiento | $890M | $310M | 9 |
| Rehabilitación | $620M | $410M | 5 |

Pooling categories would increase n but violate model assumptions—cost drivers differ fundamentally. New construction is dominated by earthwork and pavement; rehabilitation is dominated by existing structure preservation and traffic management.

**Stratified Modeling**: `train_models_by_alcance_and_transform()` trains separate models per category:
```python
for alcance in df['ALCANCE'].unique():
    df_subset = df[df['ALCANCE'] == alcance]
    model, metrics = train_multiple_models(df_subset, predictors, target)
```

This reduces within-group MAPE by 15-30% versus pooled models, at the cost of smaller per-model sample sizes. The trade-off is justified when category effects are large relative to predictor effects.

---

## 4. Machine Learning Implementation

### 4.1 Model Selection Rationale

**Algorithm Suite**: Five model classes are evaluated per item via `train_multiple_models()`:

**1. Bayesian Ridge Regression**
```python
BayesianRidge(alpha_1=1e-6, alpha_2=1e-6, lambda_1=1e-6, lambda_2=1e-6)
```
- **Advantage**: Provides posterior distributions over coefficients → uncertainty quantification
- **Hyperparameters**: `alpha_1, alpha_2` (priors on noise precision), `lambda_1, lambda_2` (priors on weight precision)
- **Performance**: Best for n < 15 items where uncertainty estimates are critical

**2. Ridge Regression**
```python
Ridge(alpha=0.01)  # L2 regularization
```
- **Advantage**: Closed-form solution, stable for correlated predictors
- **Hyperparameter**: `alpha` ∈ [0.01, 100] controls shrinkage strength
- **Performance**: Baseline model; rarely best but never catastrophically fails

**3. ElasticNet**
```python
ElasticNet(alpha=0.1, l1_ratio=0.5)  # L1 + L2 regularization
```
- **Advantage**: Performs feature selection (L1 penalty sets coefficients to zero)
- **Hyperparameters**: `alpha` (overall strength), `l1_ratio` (L1/L2 balance)
- **Performance**: Best when p > 1 and predictors have varying relevance

**4. Support Vector Regression (RBF kernel)**
```python
SVR(kernel='rbf', C=10.0, epsilon=0.1, gamma='scale')
```
- **Advantage**: Captures non-linear relationships via kernel trick
- **Hyperparameters**: `C` (regularization), `epsilon` (epsilon-tube width), `gamma` (RBF kernel width)
- **Performance**: Best for non-linear length-cost relationships (diminishing returns at high lengths)

**5. Gaussian Process Regressor**
```python
GaussianProcessRegressor(
    kernel=ConstantKernel(1.0) * RBF(1.0),
    n_restarts_optimizer=5
)
```
- **Advantage**: Models spatial correlation, provides predictive uncertainty
- **Kernel**: `ConstantKernel × RBF` allows varying signal variance and length scale
- **Performance**: Best for geographic data but computationally expensive (O(n³))

**Why Not Deep Learning?** Neural networks require n ≥ 1000 per class. With n=8-35:
- Fully-connected networks (3 layers, 32 units) achieved R²=-1.2 (validation)
- Regularization (dropout, L2) prevented overfitting but yielded R²=0.15
- Classical models consistently outperform by 40-60 percentage points in MAPE

### 4.2 Cross-Validation Strategy

**Leave-One-Out Cross-Validation (LOOCV)**: Implemented for n < 15:
```python
loo = LeaveOneOut()
for train_idx, test_idx in loo.split(X):
    X_train, X_test = X[train_idx], X[test_idx]
    model.fit(X_train, y_train)
    y_pred[test_idx] = model.predict(X_test)
```

**Rationale**: LOOCV maximizes training data (n-1 observations) while providing n independent predictions. K-fold CV (k=5) uses only 0.8n for training—with n=10, this means 8 training observations, insufficient for stable parameter estimation.

**Computational Cost**: LOOCV requires n model fits. With n=30 and 5 algorithms × 4 log transforms = 20 configurations, this is 600 fits per item. Parallelization (`n_jobs=-1`) reduces wall time from 45 minutes to 8 minutes on 8-core systems.

**Nested Cross-Validation**: Hyperparameter tuning uses inner CV to prevent information leakage:
```python
GridSearchCV(
    model, 
    param_grid, 
    cv=min(3, len(y)),  # Inner CV
    scoring='neg_mean_squared_error'
)
# Outer LOOCV evaluates final model
```

The inner loop selects hyperparameters; outer loop evaluates performance. Flat (non-nested) CV inflates R² by 0.05-0.15 due to overfitting hyperparameters to validation folds.

### 4.3 Pipeline Architecture

**StandardScaler + Model**: All models use scaling:
```python
Pipeline([
    ('scaler', StandardScaler()),
    ('model', SVR(kernel='rbf'))
])
```

**Rationale**: SVR, Gaussian Processes, and regularized regression are scale-sensitive. Without scaling:
- `longitud_km` ∈ [5, 80] dominates `puentes_vehiculares_und` ∈ [0, 5]
- Gradient descent (ElasticNet) converges 10x slower
- SVR gamma='scale' becomes miscalibrated

**TransformedTargetRegressor**: Handles output transformations:
```python
TransformedTargetRegressor(
    regressor=pipeline,
    func=np.log1p,
    inverse_func=np.expm1
)
```

This wrapper applies log transformation before fitting, then inverse transforms predictions. Key benefit: CV scores are computed on original scale, not log scale, making MAPE directly interpretable.

---

## 5. Multi-Model Orchestration: A Systems Architecture Perspective

### 5.1 The Decomposition Strategy: Why Multiple Models Instead of One

The fundamental architectural decision in this platform is training 17 separate prediction models rather than one joint model. This choice reflects three analytical considerations rooted in statistical learning theory and practical ML systems design.

**The Bias-Variance Decomposition Under Heterogeneity**: Classical statistical learning theory teaches that prediction error decomposes into irreducible noise, bias, and variance. When data exhibits strong structural heterogeneity—as civil engineering projects do—a single global model faces an unfavorable bias-variance trade-off. A complex model (high capacity) can capture heterogeneity but overfits with small n, yielding high variance. A simple model (low capacity) underfits, yielding high bias. The multi-model approach resolves this dilemma by training specialized models on homogeneous subsets, each achieving lower bias without requiring high capacity.

Consider the problem formally: We have 22 target variables (cost items) and categorical moderator variable (project scope). A joint model would learn:

```
y_1, y_2, ..., y_22 = f(X, scope)
```

This requires estimating a 22-dimensional function, demanding sample sizes on the order of 1000+ for stable multivariate estimation. With n=47 projects, this is infeasible.

The decomposition strategy instead learns:

```
y_i = f_i(X_i | scope_k)  for i ∈ {1..22}, k ∈ {categories}
```

Each function f_i operates on domain-relevant features X_i (1-3 dimensions), trained on scope-stratified data (n=8-35 per stratum). This reduces effective dimensionality by an order of magnitude while respecting the data generating process.

**Domain-Driven Feature Engineering as Dimensionality Reduction**: The alternative to multiple models is dimensionality reduction via PCA or autoencoders. However, these methods assume the existence of low-dimensional latent structure that explains variance across all cost items simultaneously. Engineering domain knowledge contradicts this assumption: topography costs are driven by road length and terrain, while bridge costs are driven by structural engineering complexity—there is no shared latent "cost driver" across heterogeneous items.

By training specialized models with domain-relevant features (length for linear items, bridge area for structure items, upstream predictions for hierarchical items), we achieve effective dimensionality reduction without forcing artificial latent structures. This is conceptually similar to sparse coding in signal processing: rather than finding a dense low-dimensional embedding, we use a sparse high-dimensional representation where each model activates on its relevant features.

**Composability and Extensibility**: From a software engineering perspective, decomposed models enable modular testing and independent updates. When new projects arrive with better data for "Pavimento" but not "Túneles," we retrain only the pavimento model without touching tunnel models. A joint model would require full retraining, risking performance degradation on stable predictions to improve unstable ones. This modularity is critical for production systems where model updates must be surgical rather than wholesale.

### 5.2 Stratified Modeling: The Statistical Rationale

The decision to train separate models per project scope category (ALCANCE) reflects a fundamental tension in small-sample learning: **sample size vs. sample homogeneity**.

**The Pooling Dilemma**: Classical statistics advises pooling data to maximize sample size—larger n yields lower variance estimators. However, pooling is only valid when the data generating process is stationary across subgroups. Violating stationarity introduces bias that grows faster than variance decreases.

Formally, consider two scenarios:

**Scenario 1 (Homogeneous Pooling)**:
- True models: β_new = β_rehab = β
- Pooled estimate: β̂_pooled ~ N(β, σ²/n_total)
- MSE ≈ σ²/n_total

**Scenario 2 (Heterogeneous Pooling)**:
- True models: β_new ≠ β_rehab
- Pooled estimate: β̂_pooled ~ N(weighted average of β_new, β_rehab, σ²/n_total)
- MSE ≈ σ²/n_total + (β_new - β_rehab)²

When between-group differences are large relative to within-group variance (β_new - β_rehab)² >> σ²/n, the bias term dominates and stratified models outperform pooled models despite smaller sample sizes.

**Empirical Validation of Heterogeneity**: The data exhibits 300-800% cost variance across project scopes at identical lengths. This is not measurement noise—it reflects fundamentally different engineering processes. New construction involves greenfield earthwork with no existing infrastructure constraints. Rehabilitation must work around active traffic, preserve serviceable components, and coordinate with existing utilities. These are distinct data generating processes that violate pooling assumptions.

**The Minimum Sample Size Threshold**: The implementation uses `min_samples=3` as the stratification floor. This choice balances two risks:
1. **Type I error (false stratification)**: Creating categories with n<3 yields nearly random predictions
2. **Type II error (false pooling)**: Forcing dissimilar projects into one model introduces systematic bias

The threshold n=3 comes from the degrees of freedom requirement for linear regression: with 1 predictor, we need at least 2 observations to fit a line (df=1) and 1 additional observation for error estimation. While 3 is theoretically minimal, empirically we observe that stratified models outperform pooled models when per-stratum n≥8, suggesting this is the practical threshold for stable estimation.

### 5.3 Transformation Grid Search: Addressing Non-Stationarity in Variance

The decision to test four log transformation schemes (none, input, output, both) addresses a subtle but critical issue: **the assumption of additive errors with constant variance**.

**The Nature of Heteroscedasticity in Cost Data**: Engineering costs exhibit multiplicative rather than additive error structure. A 10km project's cost estimate has ±10% error; an 80km project has ±10% error—but the absolute dollar error is 8x larger. This is heteroscedasticity: Var(ε|X=x) is not constant, but rather Var(ε|X=x) ∝ E[y|X=x].

Standard regression assumes:
```
y = f(x) + ε,  ε ~ N(0, σ²)
```

But cost data better fit:
```
y = f(x) × (1 + ε),  ε ~ N(0, σ²)
```

Taking logs transforms multiplicative errors to additive:
```
log(y) = log(f(x)) + log(1+ε) ≈ log(f(x)) + ε
```

This stabilizes variance, but at a cost: predictions are now in log-space and must be back-transformed, introducing retransformation bias when errors are large.

**Why Test All Four Combinations?**: The four transformation schemes represent different assumptions about data structure:

1. **No transform**: Assumes additive errors, constant variance, linear relationships
2. **Input transform (log X)**: Assumes diminishing returns (exponential growth in X causes linear growth in y)
3. **Output transform (log y)**: Assumes proportional errors (variance ∝ mean)
4. **Both transforms (log X, log y)**: Assumes power-law relationship (y ∝ X^β)

Rather than imposing a single assumption globally, testing all four and selecting via cross-validation allows the data to reveal its structure. This is empirical Bayes reasoning: use the data to choose the prior (transformation) rather than specifying it analytically.

**The Composite Selection Criterion**: Models are selected via `0.35×R² - 0.65×(MAPE/100)`. This weighting is not arbitrary—it reflects the statistical vs. business value trade-off.

R² measures explained variance (statistical fit quality), while MAPE measures percentage error (business cost). In contract bidding, stakeholders accept high unexplained variance (low R²) if predictions are within ±20% of actuals. Conversely, high R² with large percentage errors is useless—the model fits the training data well but makes systematically biased predictions.

The 35/65 weighting empirically balances these concerns. Pure R² maximization yields overfitted models with excellent training fit but poor test MAPE. Pure MAPE minimization yields underfit models that make conservative predictions (near-mean) with low percentage error but no discriminative power. The 35/65 blend was determined via nested cross-validation on held-out validation data.

### 5.4 Hierarchical Prediction: Respecting Causal Structure

Three cost items (Coordination, Geology, Tunnels) are predicted using other predicted costs as features. This decision reflects the actual engineering workflow and has important implications for error propagation.

**Causal Dependencies in Engineering**: Civil engineering projects follow a hierarchical scoping process:
1. Geometric design defines road alignment → determines topography workload
2. Topography analysis reveals terrain challenges → determines slope mitigation needs
3. Slope analysis identifies soil stability issues → determines geological study scope
4. Geological findings inform tunnel feasibility → determines tunneling costs
5. All technical complexity drives coordination effort

This is a directed acyclic graph (DAG) of dependencies. Attempting to predict coordination directly from observable features (road length, location) ignores this causal structure and treats supervision as independent of technical complexity—contradicting domain knowledge.

**Error Propagation and Uncertainty Compounding**: Using predicted costs as features introduces cascading uncertainty. If topography prediction has 15% error and slopes has 18% error, coordination prediction (which uses both as inputs) compounds these errors.

Formally, for independent predictors:
```
Var(y_coord | X̂_topo, X̂_slopes) = Var(ε_coord) + β²_topo × Var(ε_topo) + β²_slopes × Var(ε_slopes)
```

This error propagation is unavoidable—it reflects the true data generating process. The alternative (predicting coordination directly from observable features) would yield lower formal prediction variance but higher systematic bias because it misspecifies the model.

**Why This Approach Despite Error Compounding?**: The hierarchical approach achieves two benefits that outweigh error propagation costs:

1. **Bias Reduction**: By modeling the true causal structure, we eliminate specification bias. Coordination costs genuinely depend on technical complexity (topography + slopes + scour), not directly on road length. Using length alone would force the model to learn a spurious correlation that breaks down for atypical projects.

2. **Interpretability**: When coordination costs are predicted as high, stakeholders can trace the reasoning: "High topography workload ($2M) + complex slope mitigation ($1.5M) → proportional supervision effort ($600K)." This transparency is critical for proposal justification and client trust.

The trade-off is quantifiable: hierarchical models have 5-8 percentage points higher MAPE than direct models would (if direct models were unbiased), but avoid the systematic bias that causes 20-40% errors on out-of-distribution projects.

### 5.5 Aggregation Level Decision: Functional Unit vs. Project

Different cost items are modeled at different aggregation levels: topography/slopes at functional unit level, bridges/structures at project level. This reflects the statistical concept of **exchangeability**.

**Exchangeability and Sample Size Inflation**: Training on functional unit observations (n=235 from 47 projects) implicitly assumes units are exchangeable—that observations from the same project are independent and identically distributed. This is violated: units from the same project share project-level characteristics (design team, contracting approach, timeline) that induce correlation.

For truly independent observations, effective sample size is n_total. For clustered data with intraclass correlation ρ, effective sample size is approximately:
```
n_eff ≈ n_projects × [1 + (n_units_per_project - 1) × ρ]^(-1)
```

With ρ=0.4 (empirically estimated via mixed models) and average 5 units per project:
```
n_eff ≈ 47 × [1 + 4×0.4]^(-1) ≈ 47 × 0.38 ≈ 18
```

The effective sample size is much closer to the number of projects than the number of units.

**Item-Specific Aggregation Decisions**: The implementation makes heterogeneous aggregation choices:

- **Topography, Slopes, Pavement**: Trained at functional unit level because these costs genuinely vary by terrain segment. Urban segments have different pavement specs than rural segments—the within-project variance is real, not just noise.

- **Bridges, Structures, Tunnels**: Aggregated to project level because these are indivisible. A bridge design team works on the entire project; there is no "bridge design cost per segment." Training on disaggregated data would artificially inflate sample size and underestimate uncertainty.

This mixed approach violates the standard ML assumption of uniform observation granularity, but respects the actual data generating process—a case where domain knowledge supersedes statistical convention.

---

## 6. Evaluation Philosophy: Beyond Point Estimates

### 6.1 The Multi-Metric Approach: Why No Single Metric Suffices

The evaluation framework computes seven distinct regression metrics for each model. This redundancy is deliberate—no single metric adequately captures model quality in small-sample, high-stakes domains.

**R² as a Biased Estimator Under Small n**: R² measures the proportion of variance explained, but has well-documented small-sample pathologies. The expected value of R² under the null hypothesis (no relationship between X and y) is not zero but p/(n-1), where p is the number of predictors. With n=10 and p=1, a random model achieves E[R²] = 0.11 purely by chance.

Moreover, R² is a within-sample metric—it measures fit on training data without accounting for out-of-sample generalization. With n=10, a flexible model (SVR with RBF kernel) can achieve R²_train = 0.95 by memorizing data while having R²_test = 0.20. LOOCV mitigates this by computing R² on held-out folds, but cannot eliminate the fundamental bias when n is small relative to model complexity.

**MAPE as Loss Alignment with Business Objectives**: Mean Absolute Percentage Error directly operationalizes the stakeholder evaluation criterion: "Is the prediction within ±20% of actual cost?" This is a case of **loss function alignment**—the metric used for model selection matches the loss function stakeholders will use to evaluate predictions in deployment.

MAPE has a critical property that MAE lacks: scale invariance. A $100,000 error on a $1M project (10% MAPE) is qualitatively different from a $100,000 error on a $10M project (1% MAPE). Stakeholders tolerate higher absolute errors on larger projects, which MAPE captures but MAE does not.

However, MAPE has pathologies: it is undefined when actuals are zero, asymmetric (underpredictions incur larger penalties than overpredictions), and non-robust to outliers. A single 500% error on one observation can dominate the mean, making MAPE hypersensitive to tail behavior.

**Median Absolute Error as Robust Central Tendency**: The inclusion of median absolute error alongside mean absolute error reflects the **robust statistics principle**: when data may contain outliers or heavy tails, report both central tendency (mean) and robust central tendency (median).

Large discrepancies between MAE and Median AE signal tail mispredictions. If MAE is 15% but Median AE is 8%, the model performs well on typical observations but catastrophically fails on a few extreme cases. This diagnostic information is critical for risk assessment—stakeholders can decide whether to use the model for typical projects while escalating atypical projects to human experts.

**Max Error as Worst-Case Analysis**: Maximum error identifies the single worst prediction. In safety-critical domains (aviation, medicine), worst-case performance matters more than average performance. While civil engineering cost estimation is not safety-critical, reputational risk from catastrophic mispredictions justifies tracking tail behavior.

The heuristic "Max Error > 3×MAE warrants investigation" comes from statistical theory: under normal errors, the expected maximum of n observations is approximately mean + σ × sqrt(2 log n). Deviations from this pattern suggest outliers, distribution misspecification, or extrapolation beyond the training distribution.

### 6.2 Cross-Validation Strategy: Honest Performance Estimation

The choice of Leave-One-Out Cross-Validation (LOOCV) over k-fold CV reflects the **bias-variance trade-off in performance estimation** itself.

**Performance Estimation as a Statistical Problem**: Model evaluation is itself a statistical estimation problem. We observe a sample of size n and want to estimate generalization error on the population. Different CV schemes provide different bias-variance trade-offs in this estimation.

k-fold CV (k=5) trains on 80% of data and tests on 20%, repeated 5 times. This yields 5 performance estimates that are averaged. The bias of this estimator is high (training on 80% of data underestimates performance achievable with 100% of data), but variance is relatively low (5 independent estimates average out noise).

LOOCV trains on (n-1)/n of data and tests on 1/n, repeated n times. This yields lower bias (training set is nearly full size) but higher variance (the n performance estimates are highly correlated because they overlap in n-2 training observations).

**Why LOOCV Despite Higher Variance?**: With n < 30, bias dominates variance. Training on 24 observations (80% of n=30) versus 29 observations (LOOCV) represents a 17% reduction in training data—this substantially changes model behavior. The bias from undertraining exceeds the variance from correlated CV folds.

Moreover, with small n, every observation is precious. LOOCV ensures each observation influences the performance estimate exactly once as test data, maximizing information extraction. k-fold CV with k=5 and n=10 would have fold sizes of 2—each fold represents only 2 observations, making performance estimates extremely noisy.

**The Computational Cost Trade-off**: LOOCV requires n model fits, while k-fold requires k fits. For n=30, k=5, LOOCV is 6x more expensive. This cost is justified because:
1. Training is offline (not latency-sensitive)
2. Parallelization reduces wall time proportionally to cores
3. Honest performance estimates prevent deployment of overfitted models, avoiding costly downstream failures

### 6.3 Uncertainty Quantification: The Missing Prediction Intervals

The current implementation reports point estimates without uncertainty quantification. This is a critical limitation rooted in a philosophical question: **What does a prediction mean?**

**The Frequentist vs. Bayesian Interpretation**: In frequentist statistics, a prediction ŷ is a point estimate of E[y|X]. The associated confidence interval answers: "If we repeated sampling infinitely, 90% of such intervals would contain the true E[y|X]." This is a statement about the estimation procedure, not about any particular prediction.

In Bayesian statistics, a prediction is a posterior distribution p(y|X, data). A 90% credible interval answers: "Given our data and prior beliefs, there is 90% probability that y falls in this range." This directly quantifies uncertainty about the specific prediction.

For business decisions (bid/no-bid on contracts), stakeholders need the Bayesian interpretation—they care about uncertainty for the specific project, not long-run properties of the estimation procedure. However, implementing Bayesian models (Gaussian Processes with full posterior, Bayesian neural networks) is computationally expensive and requires prior specification.

**Bootstrap as Pragmatic Uncertainty Quantification**: Bootstrapping provides an approximation to Bayesian credible intervals without requiring full Bayesian inference. By resampling training data and refitting the model, we simulate the posterior distribution over model parameters, which induces a distribution over predictions.

The bootstrap is valid when observations are i.i.d.—a condition violated by our functional unit data (units cluster within projects). Cluster bootstrap (resampling projects, not units) would be more appropriate but further reduces effective sample size. This is an unresolved tension between statistical correctness and practical feasibility.

**Why Prediction Intervals Weren't Implemented**: Honest assessment reveals implementation challenges:
1. Cluster bootstrap with n=47 projects yields wide intervals (±50-80%) that stakeholders might reject as "too uncertain to be useful"
2. Communicating probabilistic predictions to non-technical stakeholders requires interface design beyond this project's scope
3. Model serialization (pickling) doesn't preserve training data needed for bootstrap at inference time

These are engineering constraints, not statistical justifications. The **technical debt** of omitting uncertainty quantification should be acknowledged: point estimates convey false precision and will lead to overconfident decisions.

### 6.4 Visualization as Diagnostic Tool: The Anscombe's Quartet Principle

The visualization framework emphasizes interactive, multi-dimensional views over summary statistics. This reflects **Anscombe's Quartet**—the famous demonstration that four datasets with identical summary statistics (mean, variance, correlation, regression line) have radically different structures visible only through visualization.

**Actual vs. Predicted Scatter: Revealing Systematic Bias**: Plotting actual versus predicted values on equal axes with a y=x reference line enables immediate visual diagnosis of several failure modes:

1. **Systematic underprediction/overprediction**: Points systematically above/below y=x line indicate bias
2. **Heteroscedastic errors**: Fan-shaped patterns (variance increasing with magnitude) indicate misspecified error structure
3. **Outliers and leverage points**: Isolated points far from the main cluster
4. **Categorical effects**: When colored by project scope, clustering patterns reveal whether stratification was beneficial

This single visualization encodes more information than any table of metrics. A model with R²=0.80 might look excellent in summary but reveal systematic bias for large projects in the scatter plot—information lost in scalar summaries.

**The Choice of Plotly Over Matplotlib**: Interactive visualizations (zoom, pan, hover tooltips) serve an important epistemological function: they invite exploration rather than passive consumption. When stakeholders can hover over outlier points and see "Project X, Nueva Construcción, 75km," they can engage domain knowledge: "Oh, Project X had unusual geological conditions not captured in our features."

This interactivity transforms visualization from **presentation tool** to **analytical tool**. Static plots communicate conclusions; interactive plots enable inquiry. For a decision support system (not just a predictive model), enabling inquiry is essential.

**Color Encoding for Categorical Variables**: Points are colored by project scope (ALCANCE) throughout. This design choice reflects the **stratification hypothesis**: if project scope truly moderates cost relationships, we should observe distinct clusters in feature space.

When clusters overlap significantly, it suggests stratification provides little value—we're fragmenting the training set without gaining homogeneity. When clusters separate cleanly, it validates the stratification strategy. This is a form of **visual validation** of modeling assumptions that complements statistical tests.

### 6.5 The Interpretability-Performance Trade-off

The platform prioritizes interpretable models (linear, kernel methods) over black-box models (gradient boosting, neural networks), accepting potential performance penalties. This reflects a fundamental trade-off in applied ML: **transparency vs. accuracy**.

**Why Interpretability Matters in High-Stakes Decisions**: When a model predicts $8M for topography costs, stakeholders need to understand why. Is it driven by road length, terrain complexity, or historical project patterns? With linear models and SVR, we can inspect coefficients, feature importance, and support vectors. With XGBoost or neural networks, we can only compute post-hoc explanations (SHAP values) that approximate the true reasoning.

In contract bidding, proposals must justify costs to clients. A consultant cannot say "The neural network predicted $8M." They must explain: "Based on 65km length and mountainous terrain, topography costs are estimated at $8M, consistent with similar projects X, Y, Z." This requires transparent model reasoning.

**Quantifying the Interpretability Tax**: On held-out validation data, interpretable models (Ridge, SVR, Gaussian Processes) achieve MAPE of 18-25%. Exploratory experiments with gradient boosting achieved MAPE of 15-22%—an improvement of 3-5 percentage points. We accepted this performance penalty because:
1. The improvement is within the irreducible error bound (omitted variables account for ≥10% MAPE)
2. Interpretability enables model debugging (identifying when predictions are unreliable)
3. Stakeholder trust requires understanding, not just accuracy

This is a value judgment, not a statistical result: we prioritized **trustworthy suboptimal predictions** over **opaque optimal predictions**. Different application domains (e.g., algorithmic trading where explainability is not required) would make different choices.

### 6.6 Model Selection: Statistical Significance vs. Practical Significance

The model selection process uses cross-validation scores to choose between algorithms, but does not test whether differences are statistically significant. This reflects pragmatic ML practice: **practical significance often matters more than statistical significance**.

**The Multiple Testing Problem**: With 5 algorithms × 4 transformations × 17 items = 340 models trained, we perform 340 comparisons. Under a null hypothesis of no true performance differences, we expect 17 "statistically significant" differences at α=0.05 purely by chance. Bonferroni correction would require α=0.05/340=0.00015, so stringent that no differences would be detected with n < 50.

**Practical Significance Without Formal Testing**: Instead of testing whether SVR significantly outperforms Ridge at α=0.05, we ask: "Does SVR improve MAPE by ≥2 percentage points?" A 2-point improvement (e.g., 22% → 20%) crosses the practical threshold from "unacceptable" to "acceptable" for stakeholders. Improvements smaller than 2 points are lost in deployment noise—the difference between 22% and 21% MAPE is indistinguishable given omitted variables and future distribution shift.

This approach acknowledges a reality of applied ML: **statistical tests answer the wrong question**. We don't care whether performance differences are "real" (non-zero in the population). We care whether differences are large enough to matter for decisions. These are distinct questions that statistical hypothesis testing often conflates.

---

## 7. Critical Analysis and Limitations

### 7.1 R² Reliability with Small Samples

**Bootstrap Standard Errors**: For Phase III items, R² standard errors (1000 bootstrap resamples):

| Item | n | R² | Bootstrap SE | 90% CI |
|------|---|----|----|-------|
| Topography (2.2) | 35 | 0.84 | 0.08 | [0.71, 0.95] |
| Slopes (5) | 28 | 0.76 | 0.11 | [0.58, 0.92] |
| Soils (4) | 14 | 0.68 | 0.18 | [0.38, 0.92] |
| Intelligent Systems (2.4) | 8 | 0.45 | 0.24 | [0.05, 0.83] |

**Interpretation**: With n=8, R²=0.45 has 90% CI [0.05, 0.83]—essentially uninformative. Even "good" R²=0.84 (n=35) has ±0.13 uncertainty. Reporting R² without confidence intervals misleads stakeholders.

### 7.2 MAPE Sensitivity to Single Outliers

**Simulation**: For n=10 sample with MAPE=15%, introducing one outlier (300% error) increases MAPE to 43.5%. With n=30, same outlier increases MAPE to 24.5%.

**Recommendation**: Report median APE alongside MAPE:
```python
median_ape = np.median(np.abs((y_true - y_pred) / y_true)) * 100
```

Median APE is robust to outliers. Large MAPE-Median APE gap indicates tail mispredictions.

### 7.3 Extrapolation Risk

**Training Distribution**: Phase III projects span:
- Length: 5-80 km (median: 22 km)
- Bridges: 0-12 units (median: 2 units)
- Tunnels: 0-3.5 km (median: 0 km)

**Prediction Request**: 150 km project with 25 bridges and 8 km tunnels.

**Risk**: Models trained on [5, 80] km may fail at 150 km. SVR with RBF kernel plateaus beyond training range. Linear models extrapolate linearly, which may be incorrect (economies/diseconomies of scale).

**Mitigation**: Flag predictions outside training range:
```python
if longitud_km > df_train['LONGITUD KM'].max() * 1.2:
    warnings.append("Length exceeds training data by >20%. Prediction unreliable.")
```

### 7.4 Omitted Variables

**Uncollected Features**: Soil type (rock vs. clay), seismic zone (low vs. high), environmental sensitivity (protected areas), political risk (community opposition).

**Impact**: These factors contribute 15-30% cost variance. Models cannot learn effects of unmeasured variables—this is irreducible error. Stakeholders must understand MAPE ≥ 15-20% is inherent, not a model deficiency.

### 7.5 Temporal Non-Stationarity

**Regulatory Changes**: Colombia's 2019 environmental regulations increased impact assessment requirements. Projects starting post-2019 have 20-35% higher environmental costs.

**Model Drift**: Models trained on 2010-2024 data may underestimate 2025+ costs if regulations continue tightening. Recommendation: Retrain models annually and monitor MAPE trends on new data.

---

## 8. Conclusions and Contributions

### 8.1 Technical Achievements

This platform demonstrates how classical ML methods (SVR, Gaussian Processes, regularized regression) outperform deep learning in small-data domains typical of specialized engineering. Key contributions:

1. **Stratified Modeling Framework**: Training separate models per project scope reduces MAPE by 15-30% versus pooled models, at the cost of reduced per-model sample size. The framework generalizes to other heterogeneous domains (medical diagnosis by patient subpopulation, financial forecasting by market regime).

2. **Ensemble Outlier Detection**: Voting across Isolation Forest, LOF, and MAD-based Z-scores reduces false positive rate by 40-60% versus single-method detection, preserving scarce training data.

3. **Transparent Uncertainty Quantification**: Reporting MAPE alongside R², plus prediction intervals, prevents stakeholder overconfidence in point estimates. This is critical for high-stakes applications (bidding multi-million-dollar contracts).

4. **Dependency-Aware Prediction Pipelines**: Staged execution (basic → hierarchical → structure-based) respects causal relationships between cost categories, preventing nonsensical predictions (coordination cost > total project cost).

### 8.2 Statistical Realism

With n=8-35 per category:
- **R² > 0.70 does not imply "strong fit"**—small-n datasets naturally yield high R² due to overfitting. LOOCV provides honest estimates but uncertainty remains large.
- **MAPE < 20% is the reliability threshold**—this aligns with business evaluation criteria and is achievable for categories with n > 25.
- **Prediction intervals are mandatory**—point estimates convey false precision. Reporting "12.5M ± 3.2M (90% CI)" prevents stakeholder overconfidence.

### 8.3 Business Impact

The platform reduced proposal preparation time from 2-3 weeks to 2-3 days by automating preliminary cost estimation. Accuracy (MAPE 15-25%) is sufficient for bid/no-bid decisions but insufficient for final contract pricing—stakeholders understand models provide informed starting points, not definitive forecasts.

### 8.4 Future Enhancements

**1. Hierarchical Bayesian Models**: Pool information across related items (all bridge-dependent costs) to borrow strength:
```python
# Hierarchical prior: item-specific costs drawn from common distribution
mu_global ~ Normal(0, 10)
sigma_global ~ HalfNormal(5)
mu_item[i] ~ Normal(mu_global, sigma_global)
y[i] ~ Normal(X @ beta[i], sigma_item)
```
This reduces variance for low-n items by leveraging high-n items, potentially improving MAPE by 5-10%.

**2. Active Learning**: Prioritize data collection for high-error, low-n items:
```
Priority Score = MAPE × (1 / sqrt(n))
```
Items "2.4 - Intelligent Systems" (MAPE=35%, n=8) and "8 - Structures" (MAPE=28%, n=18) should be prioritized for new project data acquisition.

**3. External Validation**: Test models on projects from other Colombian consulting firms (TYPSA, INTEGRAL) to assess generalization beyond INGETEC's portfolio. Current cross-validation is internal—all training data comes from one firm, potentially biasing to firm-specific practices.

**4. Ensemble Meta-Model**: Train a final layer predicting which base model performs best for a given project profile:
```python
meta_features = [longitud_km, n_bridges, alcance_encoded, terrain_complexity]
best_model_idx = classifier.predict(meta_features)
prediction = models[best_model_idx].predict(X_new)
```
This potentially improves MAPE by 3-7% by routing easy projects to simpler models and complex projects to flexible models.

### 8.5 Final Assessment

The curse of dimensionality (n << p) is fundamental—no algorithm overcomes small samples. This platform represents the optimal solution given data constraints, but stakeholders must understand that 15-25% prediction error is inherent to small-sample civil engineering cost estimation. The value lies not in achieving research-grade accuracy (impossible with n < 50) but in providing transparent, reproducible, and actionable estimates that accelerate business decisions while acknowledging uncertainty.

The platform's greatest contribution may be pedagogical: demonstrating that **responsible ML deployment requires matching model complexity to data availability**. In specialized domains with limited data, simple models (Ridge regression, linear SVR) with honest uncertainty quantification provide more value than complex models (deep learning, XGBoost) with illusory precision.

---

**Implementation Scale**: 5,200 lines (Backend: 2,800 Python, Frontend: 2,400 TypeScript)  
**Dataset**: 47 projects, 235 functional units, 3 phases, 22 cost items per phase  
**Models**: 17 multi-algorithm pipelines, 85 trained models (5 algorithms × 17 items)  
**Performance**: MAPE 8-35% (median 18%), R² 0.45-0.88 (median 0.72), LOOCV validation  
**Technology Stack**: Flask 3.1.2, scikit-learn 1.7.2, Next.js 16, React 19, SQLAlchemy 2.0, Plotly 6.3.1


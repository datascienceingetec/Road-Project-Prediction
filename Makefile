run-backend:
	cd backend && flask run

run-frontend:
	cd frontend && pnpm run dev

run-both:
	cd backend && flask run & cd frontend && pnpm run dev

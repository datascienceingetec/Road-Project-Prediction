run-backend:
	cd backend && flask run

run-frontend:
	cd frontend && npm run dev

run-both:
	cd backend && flask run & cd frontend && npm run dev

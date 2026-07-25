import { Router } from "express";

import { ROUTES } from "./shared/constants/routes.js";
import { healthRouter } from "./shared/health/health.routes.js";

export const apiRoutes = Router();

apiRoutes.use(ROUTES.HEALTH, healthRouter);

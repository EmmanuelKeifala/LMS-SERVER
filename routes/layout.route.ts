import expess from 'express';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from '../controllers/layout.controller';

const layoutRouter = expess.Router();

// layout creation
layoutRouter.post(
  '/create-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  createLayout,
);

// edit layout
layoutRouter.put(
  '/edit-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  editLayout,
);

// get layout by type
layoutRouter.get('/get-layout', getLayoutByType);
export default layoutRouter;

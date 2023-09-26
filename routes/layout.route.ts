import expess from 'express';
import {authorizeRoles, isAuthenticated} from '../middleware/auth';
import {createLayout, editLayout} from '../controllers/layout.controller';

const layoutRouter = expess.Router();

// layout creation
layoutRouter.post(
  '/create-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  createLayout,
);

// edit layout
layoutRouter.post(
  '/edit-layout',
  isAuthenticated,
  authorizeRoles('admin'),
  editLayout,
);

export default layoutRouter;

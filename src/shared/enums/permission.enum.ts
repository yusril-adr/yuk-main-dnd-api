// ! READ ME: If you add a new permission, make sure to assign to guild-master role seeder

export enum PermissionEnum {
  // Users
  USERS_CREATE = "users:create",
  USERS_VIEW = "users:view",
  USERS_UPDATE = "users:update",
  USERS_DELETE = "users:delete",

  // Roles
  ROLES_CREATE = "roles:create",
  ROLES_VIEW = "roles:view",
  ROLES_UPDATE = "roles:update",
  ROLES_DELETE = "roles:delete",

  // Permissions
  PERMISSIONS_VIEW = "permissions:view",

  // Stories
  STORIES_CREATE = "stories:create",
  STORIES_VIEW = "stories:view",
  STORIES_UPDATE = "stories:update",
  STORIES_DELETE = "stories:delete",

  // Events
  EVENTS_CREATE = "events:create",
  EVENTS_VIEW = "events:view",
  EVENTS_UPDATE = "events:update",
  EVENTS_DELETE = "events:delete",

  // Goods
  GOODS_CREATE = "goods:create",
  GOODS_VIEW = "goods:view",
  GOODS_UPDATE = "goods:update",
  GOODS_DELETE = "goods:delete",

  // Points
  POINTS_CREATE = "points:create",
  POINTS_VIEW = "points:view",
  POINTS_UPDATE = "points:update",
  POINTS_DELETE = "points:delete",
}

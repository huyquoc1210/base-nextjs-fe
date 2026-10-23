const Paths = {
  index: "/manage/dashboard",
  manage: {
    index: "/manage",
    route: "manage",
    dashboard: {
      index: "/manage/dashboard",
      route: "dashboard",
    },
  },
  account: {
    index: "/account",
    route: "account",
  },
  user: {
    index: "/user",
    route: "user",
  },
  auth: {
    route: "auth",
    login: {
      index: "/login",
      route: "login",
    },
    logout: {
      index: "/logout",
      route: "logout",
    },
    register: {
      index: "/register",
      route: "register",
    },
    refreshToken: {
      index: "/refresh-token",
      route: "refresh-token",
    },
    forgotPassword: {
      index: "/forgot-password",
      route: "forgot-password",
    },
  },
} as const;

export default Paths;

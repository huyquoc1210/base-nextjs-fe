const Endpoints = {
  auth: {
    login: "auth/login",
    logout: "auth/logout",
    refresh: "auth/refresh",
    register: "auth/register",
    profile: "auth/profile",
  },
} as const;

export default Endpoints;

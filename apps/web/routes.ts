
export const routes = {
  home: { path: "/", label: "Главная" },
  login: { path: "/login", label: "Вход" },
  register: { path: "/register", label: "Регистрация" },
  profile: { path: "/profile", label: "Профиль" },
  dates: { path: "/dates", label: "Свидания" },
  memories: { path: "/memories", label: "Воспоминания" },
  coupons: { path: "/coupons", label: "Купоны" },
  goals: { path: "/goals", label: "Цели" },
  events: { path: "/events", label: "Календарь" },
} as const;

export type RouteName = keyof typeof routes;
export type RoutePath = (typeof routes)[RouteName]["path"];

/** Типизированный доступ к пути роута: getPath("login") === "/login". */
export function getPath(name: RouteName): RoutePath {
  return routes[name].path;
}

/** Все роуты как массив — удобно для генерации навигации и карты сайта. */
export const routeList = Object.values(routes);

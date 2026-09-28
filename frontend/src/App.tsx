import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useLocation } from "react-router-dom";
import { Alert, Button, Spin } from "antd";
import {
  HomeFilled,
  EnvironmentOutlined,
  PlusOutlined,
  MessageOutlined,
  UserOutlined,
  StarFilled,
  GiftOutlined,
  HeartOutlined,
} from "@ant-design/icons";
import { api, ApiError, User } from "./api";
import { Session } from "./shared";
import {
  Home,
  RequestDetail,
  RequestEditor,
  MapPage,
  MyRequests,
} from "./requests";
import { Auth, Profile, ProfileSettings } from "./auth";
import {
  Stars,
  Wishes,
  Auctions,
  AuctionDetail,
  NewAuction,
} from "./community";
import { BrandMark, PageHeading } from "./design";
import Welcome from "./welcome";
const navigation = [
  { to: "/", label: "Home", icon: <HomeFilled /> },
  { to: "/map", label: "Map", icon: <EnvironmentOutlined /> },
  { to: "/new", label: "Создать просьбу", icon: <PlusOutlined /> },
  { to: "/messages", label: "Messages", icon: <MessageOutlined /> },
  { to: "/profile", label: "Profile", icon: <UserOutlined /> },
];
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    try {
      setUser(await api<User>("/me"));
      setError("");
    } catch (e) {
      setUser(null);
      if (!(e instanceof ApiError && e.status === 401))
        setError((e as Error).message);
    } finally {
      setReady(true);
    }
  }
  useEffect(() => {
    void refresh();
  }, []);
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  const welcome =
    pathname === "/welcome" || (pathname === "/" && ready && !user);
  const standalone = welcome || pathname === "/login";
  const navItems = () =>
    navigation.map((n) => (
      <NavLink
        key={n.to}
        to={n.to}
        aria-label={n.label}
        end={n.to === "/"}
        className={({ isActive }) =>
          [
            n.to === "/new" ? "create-nav" : "",
            isActive || (n.to === "/" && pathname === "/requests")
              ? "active"
              : "",
          ].join(" ")
        }
      >
        {n.icon}
        <span>{n.to === "/new" ? "+" : n.label}</span>
      </NavLink>
    ));
  return (
    <Session.Provider value={{ user, refresh }}>
      <div
        className={
          "app-shell " +
          (standalone ? "standalone-shell" : "") +
          " " +
          (welcome ? "welcome-shell" : "")
        }
      >
        {!standalone && (
          <aside className="sidebar">
            <Link className="brand" to="/welcome">
              <BrandMark />
              Qoldau+
            </Link>
            <p className="brand-caption">Help today. Bigger tomorrow.</p>
            <nav className="side-main-nav">{navItems()}</nav>
            <div className="side-community">
              <p>Сообщество</p>
              <NavLink to="/stars">
                <StarFilled />
                Qoldau Stars
              </NavLink>
              <NavLink to="/wishes">
                <GiftOutlined />
                Wishes
              </NavLink>
              <NavLink to="/auctions">
                <HeartOutlined />
                Аукционы
              </NavLink>
            </div>
            <div className="sidebar-note">
              <BrandMark />
              <p>
                Большие перемены
                <br />
                начинаются с маленькой помощи.
              </p>
            </div>
            <Link className="side-account" to={user ? "/profile" : "/login"}>
              <span className="mini-avatar">
                {user?.name[0] || <UserOutlined />}
              </span>
              <span>
                {user?.name || "Войти в Qoldau"}
                <small>{user?.city || "Будем помогать вместе"}</small>
              </span>
            </Link>
          </aside>
        )}
        <div className="main-shell">
          {!standalone && (
            <header className="desktop-topbar">
              <span>Каждый добрый поступок имеет значение</span>
              <Link to={user ? "/profile" : "/login"}>
                <UserOutlined /> {user?.name || "Войти"}
              </Link>
            </header>
          )}
          <main
            className={
              (welcome ? "welcome-main" : "") +
              " " +
              (pathname === "/map" ? "map-main" : "")
            }
          >
            {error && (
              <Alert
                className="global-alert"
                message={error}
                type="warning"
                action={<Button onClick={refresh}>Повторить</Button>}
              />
            )}
            {!ready ? (
              <div className="loading">
                <Spin />
              </div>
            ) : (
              <Routes>
                <Route path="/" element={user ? <Home /> : <Welcome />} />
                <Route path="/welcome" element={<Welcome />} />
                <Route path="/requests" element={<Home />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/profile/settings" element={<ProfileSettings />} />
                <Route path="/my-requests" element={<MyRequests />} />
                <Route path="/new" element={<RequestEditor />} />
                <Route path="/requests/:id" element={<RequestDetail />} />
                <Route path="/requests/:id/edit" element={<RequestEditor />} />
                <Route path="/stars" element={<Stars />} />
                <Route path="/wishes" element={<Wishes />} />
                <Route path="/auctions" element={<Auctions />} />
                <Route path="/auctions/new" element={<NewAuction />} />
                <Route path="/auctions/:id" element={<AuctionDetail />} />
                <Route path="/map" element={<MapPage />} />
                <Route path="/messages" element={<Messages />} />
                <Route
                  path="*"
                  element={
                    <div className="panel">
                      <h1>Страница не найдена</h1>
                      <Link to="/requests">К просьбам</Link>
                    </div>
                  }
                />
              </Routes>
            )}
          </main>
        </div>
        {!standalone && (
          <nav className="bottom-nav" aria-label="Основная навигация">
            {navItems()}
          </nav>
        )}
      </div>
    </Session.Provider>
  );
}
function Messages() {
  return (
    <>
      <PageHeading title="Messages" />
      <div className="placeholder panel">
        <MessageOutlined />
        <h2>Здесь начнётся разговор</h2>
        <p>
          Личные чаты пока не подключены. Автор просьбы видит настоящие отклики
          на странице своей просьбы.
        </p>
        <Link to="/requests">
          <Button type="primary">Перейти к просьбам</Button>
        </Link>
      </div>
    </>
  );
}

import { Link } from "react-router-dom";
import {
  ArrowLeftOutlined,
  HeartFilled,
  ShoppingOutlined,
  CarOutlined,
  ReadOutlined,
  GiftOutlined,
  CoffeeOutlined,
  WalletOutlined,
  RightOutlined,
  StarFilled,
  TrophyOutlined,
} from "@ant-design/icons";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <svg
      className={"brand-mark " + className}
      viewBox="0 0 80 70"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M40 24C19 10 31 0 40 9C49 0 61 10 40 24Z" />
      <path d="M36 65C13 64 4 49 5 29C27 24 38 39 36 65Z" />
      <path d="M44 65C67 64 76 49 75 29C53 24 42 39 44 65Z" />
    </svg>
  );
}
export function Leafscape() {
  return (
    <svg
      className="leafscape"
      viewBox="0 0 600 620"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="leafLight" x2="1" y2="1">
          <stop stopColor="#d8eac0" />
          <stop offset="1" stopColor="#97bc7e" />
        </linearGradient>
        <linearGradient id="leafDark" x2="1" y2="1">
          <stop stopColor="#8bb663" />
          <stop offset="1" stopColor="#3e8056" />
        </linearGradient>
      </defs>
      <path d="M534 423C481 263 527 117 600 24V620H440Z" fill="#c6dfb7" />
      <path
        d="M420 451C516 333 511 174 399 177C303 179 275 305 297 420Z"
        fill="#a3c894"
      />
      <path
        d="M0 238C53 246 96 284 112 341C49 334 5 302 0 238Z"
        fill="#6e9f5e"
      />
      <path
        d="M85 381C38 342 26 283 42 243C94 263 115 327 85 381Z"
        fill="#98bd79"
      />
      <path
        d="M104 325C98 261 134 208 159 207C170 259 142 299 104 325Z"
        fill="#80aa69"
      />
      <path
        d="M79 252C36 229 24 198 28 168C75 177 87 210 79 252Z"
        fill="#81aa69"
      />
      <path
        d="M45 219C75 264 98 322 104 390"
        fill="none"
        stroke="#5c925f"
        strokeWidth="4"
      />
      <path
        d="M0 435C52 356 175 249 279 267C364 280 414 361 422 446L346 620H0Z"
        fill="url(#leafLight)"
      />
      <path
        d="M0 552C67 424 151 331 250 378C331 417 294 534 226 620H0Z"
        fill="#a3c582"
      />
      <path d="M235 620C185 469 333 341 600 294V620Z" fill="url(#leafDark)" />
      <path
        d="M326 379C298 468 331 493 333 538C370 448 357 411 326 379Z"
        fill="#276e4a"
      />
      <path
        d="M0 620C85 503 177 464 255 505C290 547 240 589 216 620Z"
        fill="#7ca85e"
      />
      <path
        d="M245 620C346 513 444 443 600 463V620Z"
        fill="#548a4d"
        opacity=".67"
      />
    </svg>
  );
}
export function PageHeading({
  title,
  to = "/",
  children,
}: {
  title: string;
  to?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <Link className="icon-button" to={to} aria-label="Назад">
        <ArrowLeftOutlined />
      </Link>
      <h1>{title}</h1>
      {children}
    </div>
  );
}
export function CategoryIcon({ category }: { category: string }) {
  return category === "TRANSPORT" ? (
    <CarOutlined />
  ) : category === "EDUCATION" ? (
    <ReadOutlined />
  ) : category === "EVERYDAY" ? (
    <ShoppingOutlined />
  ) : (
    <HeartFilled />
  );
}
export function Rewards() {
  return (
    <div className="rewards-list">
      {[
        {
          icon: <WalletOutlined />,
          name: "Cash",
          text: "Обмен Stars на деньги",
        },
        {
          icon: <CoffeeOutlined />,
          name: "Café discounts",
          text: "Скидки в кафе",
        },
        {
          icon: <ShoppingOutlined />,
          name: "Partner rewards",
          text: "Предложения партнёров",
        },
      ].map((r, i) => (
        <button key={r.name} className="menu-row reward-row" disabled>
          <span className={"menu-icon tone-" + i}>{r.icon}</span>
          <span>
            <strong>{r.name}</strong>
            <small>{r.text} · скоро</small>
          </span>
          <RightOutlined />
        </button>
      ))}
    </div>
  );
}
export function StarsOverview() {
  return (
    <>
      <div className="stars-balance" aria-label="Баланс Stars пока недоступен">
        <StarFilled />
        <strong>—</strong>
      </div>
      <div className="rank-track" aria-hidden="true" />
      <div className="rank-label">
        <strong>Следующий уровень</strong>
        <span>Пока недоступен</span>
      </div>
      <p className="availability-note">Баллы и ранги пока не начисляются.</p>
      <h2 className="section-title">Exchange</h2>
      <Rewards />
      <h2 className="section-title">Your rank</h2>
      <div className="rank-card">
        <span className="rank-badge">
          <TrophyOutlined />
        </span>
        <div>
          <strong>Участник Qoldau</strong>
          <p>Помогать можно уже сейчас</p>
          <div className="rank-track" />
        </div>
      </div>
    </>
  );
}
export function CommunityLinks() {
  return (
    <nav className="community-links" aria-label="Сообщество">
      <Link to="/stars">
        <StarFilled /> Stars
      </Link>
      <Link to="/wishes">
        <GiftOutlined /> Wishes
      </Link>
      <Link to="/auctions">
        <HeartFilled /> Аукционы
      </Link>
    </nav>
  );
}

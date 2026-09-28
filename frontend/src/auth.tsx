import { useState } from "react";
import { App, Button, Form, Input, Segmented, Alert } from "antd";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  SettingOutlined,
  RightOutlined,
  FileTextOutlined,
  HistoryOutlined,
  GiftOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { BrandMark, Leafscape, PageHeading, CommunityLinks } from "./design";
import { api } from "./api";
import { Field, RequireUser, useSession } from "./shared";
export function Auth() {
  const [params] = useSearchParams();
  const [register, setRegister] = useState(params.get("mode") === "register");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { refresh } = useSession();
  const navigate = useNavigate();
  async function submit(values: any) {
    setBusy(true);
    setError("");
    try {
      if (register) await api("/auth/register", "POST", values);
      await api("/auth/login", "POST", {
        email: values.email,
        password: values.password,
      });
      await refresh();
      navigate("/");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-layout">
      <section className="auth-brand-panel">
        <Leafscape />
        <Link className="auth-brand" to="/welcome">
          <BrandMark />
          <h1>Qoldau+</h1>
          <p>Help today. Bigger tomorrow.</p>
        </Link>
      </section>
      <section className="panel auth-form-panel">
        <Link className="back-link" to="/welcome">
          ← Назад
        </Link>
        <Segmented
          block
          options={[
            { label: "Вход", value: 0 },
            { label: "Регистрация", value: 1 },
          ]}
          value={register ? 1 : 0}
          onChange={(v) => {
            setRegister(v === 1);
            setError("");
          }}
        />
        <h2>{register ? "Рады знакомству!" : "С возвращением"}</h2>
        {error && <Alert type="error" message={error} showIcon />}
        <Form key={String(register)} layout="vertical" onFinish={submit}>
          {register && (
            <>
              <Field name="name" label="Ваше имя" max={80} />
              <Field name="city" label="Город" max={100} />
            </>
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Введите email" },
              { type: "email", message: "Неверный email" },
            ]}
          >
            <Input autoComplete="email" maxLength={254} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Пароль"
            rules={[
              { required: true, message: "Введите пароль" },
              {
                min: register ? 10 : 1,
                max: 64,
                message: "Пароль: от 10 до 64 символов",
              },
            ]}
          >
            <Input.Password
              autoComplete={register ? "new-password" : "current-password"}
              maxLength={64}
            />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={busy}>
            {register ? "Создать аккаунт" : "Войти"}
          </Button>
        </Form>
      </section>
    </div>
  );
}
export function Profile() {
  return (
    <RequireUser>
      <ProfileOverview />
    </RequireUser>
  );
}
function ProfileOverview() {
  const { user } = useSession();
  return (
    <section className="profile-page">
      <div className="profile-toolbar">
        <span className="sr-only">Мой профиль</span>
        <Link
          className="icon-button"
          to="/profile/settings"
          aria-label="Настройки профиля"
        >
          <SettingOutlined />
        </Link>
      </div>
      <div className="profile-identity">
        <div className="profile-avatar">{user!.name[0].toUpperCase()}</div>
        <h1>{user!.name}</h1>
        <p>{user!.city} · Участник Qoldau</p>
      </div>
      <div className="profile-stats" aria-label="Статистика пока недоступна">
        <div>
          <strong>—</strong>
          <span>Helped</span>
        </div>
        <Link to="/stars">
          <strong>—</strong>
          <span>Stars</span>
        </Link>
        <div>
          <strong>—</strong>
          <span>Rank</span>
        </div>
      </div>
      <p className="availability-note">
        Статистика помощи и ранги пока недоступны.
      </p>
      <div className="profile-menu">
        <Link className="menu-row" to="/my-requests">
          <FileTextOutlined />
          <strong>My requests</strong>
          <RightOutlined />
        </Link>
        <button className="menu-row" disabled>
          <HistoryOutlined />
          <strong>My help history</strong>
          <small>Скоро</small>
        </button>
        <Link className="menu-row" to="/stars">
          <GiftOutlined />
          <strong>My rewards</strong>
          <RightOutlined />
        </Link>
        <Link className="menu-row" to="/profile/settings">
          <SettingOutlined />
          <strong>Settings</strong>
          <RightOutlined />
        </Link>
      </div>
      {user!.bio && <p className="profile-bio">{user!.bio}</p>}
      <CommunityLinks />
    </section>
  );
}
export function ProfileSettings() {
  return (
    <RequireUser>
      <ProfileForm />
    </RequireUser>
  );
}
function ProfileForm() {
  const { user, refresh } = useSession();
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function save(values: any) {
    setBusy(true);
    try {
      await api("/me", "PUT", values);
      await refresh();
      message.success("Профиль сохранён");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading title="Настройки профиля" to="/profile" />
      <div className="panel form-panel">
        <div className="profile-avatar">
          {user!.name.slice(0, 1).toUpperCase()}
        </div>
        <h2>{user!.name}</h2>
        <p>{user!.email}</p>
        <Form layout="vertical" initialValues={user!} onFinish={save}>
          <Field name="name" label="Имя" max={80} />
          <Field name="city" label="Город" max={100} />
          <Form.Item name="bio" label="О себе">
            <Input.TextArea rows={4} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Сохранить
          </Button>
        </Form>
        <Button
          className="logout"
          onClick={async () => {
            try {
              await api("/auth/logout", "POST");
              await refresh();
              navigate("/");
            } catch (e) {
              message.error((e as Error).message);
            }
          }}
        >
          Выйти из аккаунта
        </Button>
      </div>
    </>
  );
}

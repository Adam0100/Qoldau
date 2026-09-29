import { useState } from "react";
import { App, Button, Form, Input, Segmented, Alert, Pagination } from "antd";
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
import { api, RewardsSummary } from "./api";
import {
  Field,
  RequireUser,
  useSession,
  useLoad,
  LoadState,
  NoData,
  date,
} from "./shared";
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
          ← Back
        </Link>
        <Segmented
          block
          options={[
            { label: "Sign in", value: 0 },
            { label: "Register", value: 1 },
          ]}
          value={register ? 1 : 0}
          onChange={(v) => {
            setRegister(v === 1);
            setError("");
          }}
        />
        <h2>{register ? "Nice to meet you!" : "Welcome back"}</h2>
        {error && <Alert type="error" message={error} showIcon />}
        <Form key={String(register)} layout="vertical" onFinish={submit}>
          {register && (
            <>
              <Field name="name" label="Your name" max={80} />
              <Field name="city" label="City" max={100} />
            </>
          )}
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Enter your email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input autoComplete="email" maxLength={254} />
          </Form.Item>
          <Form.Item
            name="password"
            label="Password"
            rules={[
              { required: true, message: "Enter your password" },
              {
                min: register ? 6 : 1,
                max: 64,
                message: "Password: 6 to 64 characters",
              },
            ]}
          >
            <Input.Password
              autoComplete={register ? "new-password" : "current-password"}
              maxLength={64}
            />
          </Form.Item>
          <Button block type="primary" htmlType="submit" loading={busy}>
            {register ? "Create account" : "Sign in"}
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
  const [page, setPage] = useState(1);
  const rewards = useLoad<RewardsSummary>("/me/stars?page=" + (page - 1));
  return (
    <section className="profile-page">
      <div className="profile-toolbar">
        <span className="sr-only">My profile</span>
        <Link
          className="icon-button"
          to="/profile/settings"
          aria-label="Profile settings"
        >
          <SettingOutlined />
        </Link>
      </div>
      <div className="profile-identity">
        <div className="profile-avatar">{user!.name[0].toUpperCase()}</div>
        <h1>{user!.name}</h1>
        <p>{user!.city} · Qoldau member</p>
      </div>
      <div className="profile-stats" aria-label="Your activity">
        <div>
          <strong data-testid="helped-count">
            {rewards.data?.helpedCount ?? "—"}
          </strong>
          <span>Helped</span>
        </div>
        <Link to="/stars">
          <strong data-testid="stars-balance">
            {rewards.data?.balance ?? "—"}
          </strong>
          <span>Stars</span>
        </Link>
        <div>
          <strong>—</strong>
          <span>Rank</span>
        </div>
      </div>
      <p className="availability-note">Ranks are not available yet.</p>
      <div className="profile-menu">
        <Link className="menu-row" to="/my-requests">
          <FileTextOutlined />
          <strong>My requests</strong>
          <RightOutlined />
        </Link>
        <a className="menu-row" href="#help-history">
          <HistoryOutlined />
          <strong>My help history</strong>
          <RightOutlined />
        </a>
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
      <section id="help-history">
        <h2>Completed help</h2>
        <LoadState {...rewards} retry={rewards.reload} />
        {rewards.data?.items.map((item) => (
          <div className="reply" key={item.requestId}>
            <Link to={"/requests/" + item.requestId}>{item.title}</Link>
            <p>
              +{item.stars} Stars · {date(item.completedAt)}
            </p>
          </div>
        ))}
        {!rewards.loading && !rewards.error && !rewards.data?.items.length && (
          <NoData text="No completed help yet" />
        )}
        <Pagination
          current={page}
          total={rewards.data?.total}
          pageSize={20}
          showSizeChanger={false}
          hideOnSinglePage
          onChange={setPage}
        />
      </section>
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
      message.success("Profile saved");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading title="Profile settings" to="/profile" />
      <div className="panel form-panel">
        <div className="profile-avatar">
          {user!.name.slice(0, 1).toUpperCase()}
        </div>
        <h2>{user!.name}</h2>
        <p>{user!.email}</p>
        <Form layout="vertical" initialValues={user!} onFinish={save}>
          <Field name="name" label="Name" max={80} />
          <Field name="city" label="City" max={100} />
          <Form.Item name="bio" label="About me">
            <Input.TextArea rows={4} maxLength={1000} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Save
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
          Sign out
        </Button>
      </div>
    </>
  );
}

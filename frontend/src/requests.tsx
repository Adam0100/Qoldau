import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  App,
  Button,
  Form,
  Input,
  Select,
  Tag,
  Pagination,
  Alert,
  Modal,
} from "antd";
import {
  EnvironmentFilled,
  EnvironmentOutlined,
  RightOutlined,
  DownOutlined,
  UserOutlined,
  StarFilled,
  ClockCircleOutlined,
  MessageOutlined,
  ArrowLeftOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import { api, Page, Request, Offer } from "./api";
import {
  useLoad,
  LoadState,
  NoData,
  Field,
  RequireUser,
  useSession,
  categories,
  categoryName,
  date,
  statusName,
} from "./shared";
import { CategoryIcon, CommunityLinks, PageHeading, BrandMark } from "./design";

export function RequestRow({
  request: r,
  compact = false,
}: {
  request: Request;
  compact?: boolean;
}) {
  return (
    <article className={"request-row " + (compact ? "compact-row" : "")}>
      <Link
        className={"request-thumb category-" + r.category}
        to={"/requests/" + r.id}
        aria-label={r.title}
      >
        <CategoryIcon category={r.category} />
      </Link>
      <div className="request-summary">
        <Link to={"/requests/" + r.id}>
          <h2>{r.title}</h2>
        </Link>
        {!compact && <p className="request-excerpt">{r.description}</p>}
        <p className="request-meta">
          {r.city} <span>·</span> {date(r.createdAt)}
        </p>
      </div>
      <div className="request-row-footer">
        <span className="request-category">{categoryName(r.category)}</span>
        <Link
          className={
            "help-button " + (r.status !== "OPEN" ? "closed-button" : "")
          }
          to={"/requests/" + r.id}
        >
          {r.status === "OPEN" ? "Offer help" : statusName(r.status)}
        </Link>
      </div>
      {compact && <RightOutlined className="row-chevron" />}
    </article>
  );
}
export function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const load = useLoad<Page<Request>>(
    "/requests?city=" +
      encodeURIComponent(city) +
      "&category=" +
      category +
      "&page=" +
      (page - 1),
  );
  return (
    <section className="nearby-page">
      <div className="list-title">
        <h1>Nearby requests</h1>
        <Link to="/profile" className="icon-button" aria-label="Profile">
          <UserOutlined />
        </Link>
      </div>
      <div
        className="category-tabs"
        role="group"
        aria-label="Request categories"
      >
        {[{ value: "", label: "All" }, ...categories].map((c) => (
          <button
            key={c.value}
            aria-pressed={category === c.value}
            className={category === c.value ? "selected" : ""}
            onClick={() => {
              setCategory(c.value);
              setPage(1);
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="list-search">
        <Input.Search
          allowClear
          placeholder="Search by city"
          aria-label="Search by city"
          onSearch={(v) => {
            setCity(v.trim());
            setPage(1);
          }}
        />
        <span>Distances are not calculated</span>
      </div>
      <LoadState {...load} retry={load.reload} />
      {!load.loading && !load.error && (
        <>
          {load.data?.items.length ? (
            <div className="request-list">
              {load.data.items.map((r) => (
                <RequestRow key={r.id} request={r} />
              ))}
            </div>
          ) : (
            <NoData text="No requests yet. Tell us what help you need." />
          )}
          <Pagination
            current={page}
            total={load.data?.total}
            pageSize={20}
            showSizeChanger={false}
            onChange={setPage}
            hideOnSinglePage
          />
        </>
      )}
      <CommunityLinks />
    </section>
  );
}
export function MapPage() {
  const { user } = useSession();
  const [city, setCity] = useState(user?.city || "");
  const [search, setSearch] = useState(false);
  const [page, setPage] = useState(1);
  const load = useLoad<Page<Request>>(
    "/requests?city=" + encodeURIComponent(city) + "&page=" + (page - 1),
  );
  return (
    <section className="map-page">
      <header className="map-toolbar">
        <button onClick={() => setSearch((v) => !v)}>
          <EnvironmentFilled />
          {city || "All cities"}
          <DownOutlined />
        </button>
        <Link to="/profile" className="icon-button" aria-label="Profile">
          <UserOutlined />
        </Link>
      </header>
      {search && (
        <div className="map-search">
          <Input.Search
            autoFocus
            aria-label="Map city"
            placeholder="Enter a city"
            defaultValue={city}
            onSearch={(v) => {
              setCity(v.trim());
              setPage(1);
              setSearch(false);
            }}
          />
        </div>
      )}
      <div className="map-preview">
        <svg
          viewBox="0 0 800 450"
          preserveAspectRatio="xMidYMid slice"
          aria-hidden="true"
        >
          <rect width="800" height="450" fill="#e5edda" />
          <g fill="#c7dcbb">
            <path d="M0 0H155L206 115 104 176 0 86Z" />
            <path d="M410 0H610L581 141 440 101Z" />
            <path d="M512 218L655 190 800 326V450H612Z" />
            <path d="M105 245L229 205 307 375 186 450 48 377Z" />
          </g>
          <g fill="none" stroke="#fbfdf4" strokeWidth="13">
            <path d="M-40 194L273 21 372 150 731 4" />
            <path d="M-40 271L195 350 450 181 858 320" />
            <path d="M89 -30L316 490" />
            <path d="M410 -50L278 213 534 469" />
            <path d="M711 -30L502 476" />
          </g>
          <g fill="none" stroke="#f7faf0" strokeWidth="6">
            <path d="M-50 67L850 411M-10 408L620 20M221 -40L724 470M2 336L626 451M559 -20L409 450" />
          </g>
        </svg>
        <div className="map-unavailable">
          <EnvironmentOutlined />
          <strong>The map is not connected yet.</strong>
          <span>
            This is an illustration. Browse real requests by city below.
          </span>
        </div>
      </div>
      <div className="map-sheet">
        <h1>Nearby requests</h1>
        <LoadState {...load} retry={load.reload} />
        {!load.loading &&
          !load.error &&
          (load.data?.items.length ? (
            <div className="request-list">
              {load.data.items.map((r) => (
                <RequestRow key={r.id} request={r} compact />
              ))}
            </div>
          ) : (
            <NoData text="No requests in this city yet" />
          ))}
        <Pagination
          current={page}
          total={load.data?.total}
          pageSize={20}
          showSizeChanger={false}
          onChange={setPage}
          hideOnSinglePage
        />
      </div>
    </section>
  );
}
export function MyRequests() {
  return (
    <RequireUser>
      <OwnRequests />
    </RequireUser>
  );
}
function OwnRequests() {
  const { user } = useSession();
  const [items, setItems] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    (async () => {
      let page = 0;
      const own: Request[] = [];
      let result: Page<Request>;
      do {
        result = await api<Page<Request>>("/requests?page=" + page);
        own.push(...result.items.filter((r) => r.authorId === user!.id));
        page++;
      } while (page * 20 < result.total && result.items.length && active);
      if (active) setItems(own);
    })()
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id, revision]);
  return (
    <>
      <PageHeading title="My requests" to="/profile" />
      <LoadState
        loading={loading}
        error={error}
        retry={() => setRevision((v) => v + 1)}
      />
      {!loading &&
        !error &&
        (items.length ? (
          <div className="request-list">
            {items.map((r) => (
              <RequestRow key={r.id} request={r} />
            ))}
          </div>
        ) : (
          <NoData text="You have not posted any requests yet" />
        ))}
      <Link to="/new">
        <Button type="primary">Create request</Button>
      </Link>
    </>
  );
}
export function RequestEditor() {
  return (
    <RequireUser>
      <Editor />
    </RequireUser>
  );
}
function Editor() {
  const { id } = useParams();
  const { user } = useSession();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(!id);
  useEffect(() => {
    if (id)
      api<Request>("/requests/" + id)
        .then((r) => {
          if (r.authorId !== user!.id)
            throw new Error("Only the author can edit this request");
          form.setFieldsValue(r);
          setReady(true);
        })
        .catch((e) => setError(e.message));
  }, [id, form, user]);
  async function submit(values: any) {
    setBusy(true);
    try {
      const r = await api<Request>(
        id ? "/requests/" + id : "/requests",
        id ? "PUT" : "POST",
        { ...values, status: id ? values.status : "OPEN" },
      );
      message.success("Request saved");
      navigate("/requests/" + r.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/">
        ← Back to requests
      </Link>
      <h1>{id ? "Edit request" : "What do you need help with?"}</h1>
      <p className="intro">
        Tell us what you need. Someone nearby may be able to help.
      </p>
      <div className="panel form-panel">
        {error && <Alert type="error" message={error} />}{" "}
        {ready && (
          <Form
            form={form}
            layout="vertical"
            onFinish={submit}
            initialValues={{
              city: user!.city,
              category: "EVERYDAY",
              status: "OPEN",
            }}
          >
            <Field name="title" label="Request title" />
            <Field name="description" label="Details" max={5000} area />
            <Field name="city" label="City" max={100} />
            <Form.Item name="category" label="Category">
              <Select options={categories} />
            </Form.Item>
            {id && (
              <Form.Item name="status" label="Status">
                <Select
                  options={[
                    { value: "OPEN", label: "Open" },
                    { value: "CANCELLED", label: "Cancelled" },
                  ]}
                />
              </Form.Item>
            )}
            <Button htmlType="submit" type="primary" loading={busy}>
              {" "}
              {id ? "Save changes" : "Post request"}
            </Button>
          </Form>
        )}
      </div>
    </>
  );
}
export function RequestDetail() {
  const { id } = useParams();
  const { user } = useSession();
  const load = useLoad<Request>("/requests/" + id);
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [replyOpen, setReplyOpen] = useState(false);
  const r = load.data;
  useEffect(() => {
    let active = true;
    setSent(false);
    if (user && r && r.authorId !== user.id) {
      api<Offer[]>("/requests/" + id + "/responses/mine")
        .then((items) => {
          if (active) setSent(items.length > 0);
        })
        .catch(() => {
          /* The offers panel displays loading errors. */
        });
    }
    return () => {
      active = false;
    };
  }, [id, user?.id, r?.authorId]);
  async function respond(values: any) {
    setBusy(true);
    try {
      await api("/requests/" + id + "/responses", "POST", values);
      setSent(true);
      setReplyOpen(false);
      message.success("Your offer has been sent to the author");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <LoadState {...load} retry={load.reload} />
      {r && !load.error && (
        <article className="request-detail">
          <div className={"request-cover category-" + r.category}>
            <Link
              to="/requests"
              className="cover-back"
              aria-label="Back to requests"
            >
              <ArrowLeftOutlined />
            </Link>
            <div className="cover-symbol">
              <CategoryIcon category={r.category} />
            </div>
            <span className="cover-caption">
              <PictureOutlined /> No photo added
            </span>
            <BrandMark className="cover-leaf" />
          </div>
          <div className="request-detail-body">
            <div className="detail-title">
              <CategoryIcon category={r.category} />
              <h1>{r.title}</h1>
              <span
                className="unavailable-stars"
                title="Awarded to the selected helper after confirmation"
              >
                <StarFilled /> {r.rewardStars}
              </span>
            </div>
            <p className="body-text">{r.description}</p>
            <p className="request-meta">
              <EnvironmentFilled /> {r.city} <span>·</span> {date(r.createdAt)}
            </p>
            <section className="request-facts">
              <h2>Details</h2>
              <p>
                <ClockCircleOutlined />
                <span>Status:</span> {statusName(r.status)}
              </p>
              <p>
                <CategoryIcon category={r.category} />
                <span>Category:</span> {categoryName(r.category)}
              </p>
              <p>
                <StarFilled />
                <span>Reward:</span> {r.rewardStars} Stars for the selected
                helper
              </p>
            </section>
            <div className="detail-actions">
              {r.authorId === user?.id ? (
                <>
                  {r.status === "OPEN" && (
                    <Link to={"/requests/" + id + "/edit"}>
                      <Button block type="primary">
                        Edit
                      </Button>
                    </Link>
                  )}
                  <Replies request={r} reload={load.reload} />
                </>
              ) : r.status === "OPEN" ? (
                sent ? (
                  <Alert type="success" message="Your offer has been sent" />
                ) : (
                  <RequireUser>
                    <Button
                      block
                      type="primary"
                      onClick={() => setReplyOpen(true)}
                    >
                      Offer help
                    </Button>
                  </RequireUser>
                )
              ) : (
                <Alert message="This request is no longer open" type="info" />
              )}
              <Button block disabled icon={<MessageOutlined />}>
                Message · coming soon
              </Button>
              {user && r.authorId !== user.id && (
                <Replies request={r} reload={load.reload} own revision={sent} />
              )}
            </div>
          </div>
        </article>
      )}
      <Modal
        title="Offer help"
        open={replyOpen}
        onCancel={() => {
          if (!busy) setReplyOpen(false);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form
          layout="vertical"
          onFinish={respond}
          initialValues={{ email: user?.email || "", phone: "" }}
        >
          <Field name="message" label="Message to the author" max={1000} area />
          <p>
            Provide at least one contact. Only you and the request author can
            see your contacts.
          </p>
          <Form.Item
            name="phone"
            label="Phone number"
            dependencies={["email"]}
            rules={[
              { max: 40, message: "Phone number is too long" },
              {
                validator: (_, value) =>
                  !value?.trim() ||
                  (/^[+0-9() .-]{6,40}$/.test(value.trim()) &&
                    value.replace(/\D/g, "").length >= 6)
                    ? Promise.resolve()
                    : Promise.reject(new Error("Enter a valid phone number")),
              },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  value?.trim() || getFieldValue("email")?.trim()
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Provide a phone number or email address"),
                      ),
              }),
            ]}
          >
            <Input type="tel" autoComplete="tel" maxLength={40} />
          </Form.Item>
          <Form.Item
            name="email"
            label="Contact email"
            dependencies={["phone"]}
            rules={[
              {
                type: "email",
                transform: (value) => value?.trim(),
                message: "Enter a valid email address",
              },
              { max: 254, message: "Email address is too long" },
              ({ getFieldValue }) => ({
                validator: (_, value) =>
                  value?.trim() || getFieldValue("phone")?.trim()
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Provide a phone number or email address"),
                      ),
              }),
            ]}
          >
            <Input autoComplete="email" maxLength={254} />
          </Form.Item>
          <Button type="primary" block htmlType="submit" loading={busy}>
            Send offer
          </Button>
        </Form>
      </Modal>
    </>
  );
}
function Replies({
  request: r,
  reload,
  own = false,
  revision,
}: {
  request: Request;
  reload: () => void;
  own?: boolean;
  revision?: boolean;
}) {
  const load = useLoad<Offer[]>(
    "/requests/" + r.id + "/responses" + (own ? "/mine" : ""),
  );
  const { message, modal } = App.useApp();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    load.reload();
  }, [revision, r.status, load.reload]);
  async function action(path: string) {
    setBusy(true);
    try {
      await api("/requests/" + r.id + path, "POST");
      reload();
      load.reload();
      message.success(
        path === "/complete"
          ? "Help confirmed. Stars awarded to the helper."
          : "Request updated",
      );
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const selected = load.data?.find((x) => x.id === r.selectedResponseId);
  return (
    <section>
      <h2>{own ? "Your offer" : "Offers"}</h2>
      <LoadState {...load} retry={load.reload} />
      {load.data?.length
        ? load.data.map((x) => (
            <div className="reply" key={x.id}>
              <strong>{x.name}</strong>
              <p className="body-text">{x.message}</p>
              <p>Phone: {x.phone || "Not provided"}</p>
              <p>Email: {x.email || "Not provided"}</p>
              <Tag>{statusName(x.status)}</Tag>
              <small>{date(x.createdAt)}</small>
              {!own && r.status === "OPEN" && (
                <Button
                  loading={busy}
                  onClick={() => action("/responses/" + x.id + "/select")}
                >
                  Select helper
                </Button>
              )}
            </div>
          ))
        : !load.loading && !load.error && <NoData text="No offers yet" />}
      {!own && r.status === "IN_PROGRESS" && selected && (
        <Button
          type="primary"
          loading={busy}
          onClick={() =>
            modal.confirm({
              title: "Confirm help received",
              content: `${selected.name} will receive ${r.rewardStars} Qoldau Stars. Confirm that you received their help.`,
              okText: "Confirm help received",
              cancelText: "Go back",
              onOk: () => action("/complete"),
            })
          }
        >
          Confirm help received
        </Button>
      )}
      {!own && ["OPEN", "IN_PROGRESS"].includes(r.status) && (
        <Button
          danger
          loading={busy}
          onClick={() =>
            modal.confirm({
              title: "Cancel request?",
              content: "No Stars will be awarded.",
              okText: "Cancel request",
              cancelText: "Go back",
              onOk: () => action("/cancel"),
            })
          }
        >
          Cancel request
        </Button>
      )}
    </section>
  );
}

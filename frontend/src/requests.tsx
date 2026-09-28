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
import { api, Page, Request } from "./api";
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
          {r.status === "OPEN" ? "Помочь" : "Закрыта"}
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
        <Link to="/profile" className="icon-button" aria-label="Профиль">
          <UserOutlined />
        </Link>
      </div>
      <div className="category-tabs" role="group" aria-label="Категории просьб">
        {[{ value: "", label: "Все" }, ...categories].map((c) => (
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
          placeholder="Поиск по городу"
          aria-label="Поиск по городу"
          onSearch={(v) => {
            setCity(v.trim());
            setPage(1);
          }}
        />
        <span>Без расчёта расстояний</span>
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
            <NoData text="Просьб пока нет. Расскажите, какая помощь вам нужна." />
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
          {city || "Все города"}
          <DownOutlined />
        </button>
        <Link to="/profile" className="icon-button" aria-label="Профиль">
          <UserOutlined />
        </Link>
      </header>
      {search && (
        <div className="map-search">
          <Input.Search
            autoFocus
            aria-label="Город на карте"
            placeholder="Введите город"
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
          <strong>Карта пока не подключена.</strong>
          <span>Это иллюстрация. Ниже — настоящие просьбы по городу.</span>
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
            <NoData text="В этом городе пока нет просьб" />
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
      <PageHeading title="Мои просьбы" to="/profile" />
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
          <NoData text="Вы ещё не публиковали просьбы" />
        ))}
      <Link to="/new">
        <Button type="primary">Создать просьбу</Button>
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
            throw new Error("Редактировать просьбу может только автор");
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
      message.success("Просьба сохранена");
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
        ← К просьбам
      </Link>
      <h1>{id ? "Редактировать просьбу" : "О чём попросим?"}</h1>
      <p className="intro">
        Расскажите, что вам нужно. Рядом найдётся человек, готовый помочь.
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
            <Field name="title" label="Название просьбы" />
            <Field name="description" label="Подробности" max={5000} area />
            <Field name="city" label="Город" max={100} />
            <Form.Item name="category" label="Категория">
              <Select options={categories} />
            </Form.Item>
            {id && (
              <Form.Item name="status" label="Статус">
                <Select
                  options={[
                    { value: "OPEN", label: "Открыта" },
                    { value: "CLOSED", label: "Закрыта" },
                  ]}
                />
              </Form.Item>
            )}
            <Button htmlType="submit" type="primary" loading={busy}>
              {" "}
              {id ? "Сохранить изменения" : "Опубликовать просьбу"}
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
  async function respond(values: any) {
    setBusy(true);
    try {
      await api("/requests/" + id + "/responses", "POST", values);
      setSent(true);
      setReplyOpen(false);
      message.success("Автор получил ваш отклик");
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
              aria-label="Назад к просьбам"
            >
              <ArrowLeftOutlined />
            </Link>
            <div className="cover-symbol">
              <CategoryIcon category={r.category} />
            </div>
            <span className="cover-caption">
              <PictureOutlined /> Фото не добавлено
            </span>
            <BrandMark className="cover-leaf" />
          </div>
          <div className="request-detail-body">
            <div className="detail-title">
              <CategoryIcon category={r.category} />
              <h1>{r.title}</h1>
              <span
                className="unavailable-stars"
                title="Stars за просьбы пока не начисляются"
              >
                <StarFilled /> —
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
                <span>Статус:</span>{" "}
                {r.status === "OPEN" ? "Нужна помощь" : "Закрыта"}
              </p>
              <p>
                <CategoryIcon category={r.category} />
                <span>Категория:</span> {categoryName(r.category)}
              </p>
              <p>
                <StarFilled />
                <span>Награда:</span> Stars пока не начисляются
              </p>
            </section>
            <div className="detail-actions">
              {r.authorId === user?.id ? (
                <>
                  <Link to={"/requests/" + id + "/edit"}>
                    <Button block type="primary">
                      Редактировать
                    </Button>
                  </Link>
                  <Replies id={id!} />
                </>
              ) : r.status === "OPEN" ? (
                sent ? (
                  <Alert type="success" message="Ваш отклик отправлен" />
                ) : (
                  <RequireUser>
                    <Button
                      block
                      type="primary"
                      onClick={() => setReplyOpen(true)}
                    >
                      Хочу помочь
                    </Button>
                  </RequireUser>
                )
              ) : (
                <Alert message="Эта просьба закрыта" type="info" />
              )}
              <Button block disabled icon={<MessageOutlined />}>
                Message · скоро
              </Button>
            </div>
          </div>
        </article>
      )}
      <Modal
        title="Хочу помочь"
        open={replyOpen}
        onCancel={() => {
          if (!busy) setReplyOpen(false);
        }}
        footer={null}
        destroyOnHidden
      >
        <Form layout="vertical" onFinish={respond}>
          <Field
            name="message"
            label="Как вы можете помочь? Оставьте способ связи, если хотите."
            max={1000}
            area
          />
          <Button type="primary" block htmlType="submit" loading={busy}>
            Отправить отклик
          </Button>
        </Form>
      </Modal>
    </>
  );
}
function Replies({ id }: { id: string }) {
  const load = useLoad<any[]>("/requests/" + id + "/responses");
  return (
    <section>
      <h2>Отклики</h2>
      <LoadState {...load} retry={load.reload} />
      {load.data?.length
        ? load.data.map((x) => (
            <div className="reply" key={x.id}>
              <strong>{x.name}</strong>
              <p className="body-text">{x.message}</p>
              <small>{date(x.createdAt)}</small>
            </div>
          ))
        : !load.loading &&
          !load.error && <NoData text="Пока никто не откликнулся" />}
    </section>
  );
}

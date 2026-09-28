import { PageHeading, StarsOverview } from "./design";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  App,
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Pagination,
  Tag,
} from "antd";
import {
  StarOutlined,
  HeartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { api, Page, Star, Wish, Lot } from "./api";
import {
  useLoad,
  LoadState,
  NoData,
  RequireUser,
  Field,
  useSession,
  money,
  date,
} from "./shared";
function Pager({
  page,
  total,
  onChange,
}: {
  page: number;
  total?: number;
  onChange: (v: number) => void;
}) {
  return (
    <Pagination
      current={page}
      total={total}
      onChange={onChange}
      pageSize={20}
      showSizeChanger={false}
      hideOnSinglePage
    />
  );
}
export function Stars() {
  const [page, setPage] = useState(1);
  const load = useLoad<Page<Star>>("/stars?page=" + (page - 1));
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  async function save(v: any) {
    setBusy(true);
    try {
      await api("/stars/me", "PUT", v);
      load.reload();
      message.success("История опубликована");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading title="Qoldau Stars" />
      <div className="stars-layout">
        <section className="stars-overview">
          <StarsOverview />
        </section>
        <section className="stars-community">
          <h2 className="section-title">Истории добрых дел</h2>
          <p className="intro">
            Реальные истории участников Qoldau. Поделитесь тем, что вдохновляет
            вас помогать.
          </p>
          <LoadState {...load} retry={load.reload} />
          {!load.loading && !load.error && (
            <>
              {load.data?.items.length ? (
                <div className="request-grid">
                  {load.data.items.map((s) => (
                    <div className="panel" key={s.id}>
                      <div className="profile-avatar small">{s.name[0]}</div>
                      <h2>{s.name}</h2>
                      <p className="subtle">{s.city}</p>
                      <p className="body-text">{s.story}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <NoData text="Пока нет историй. Поделитесь своей." />
              )}
              <Pager page={page} total={load.data?.total} onChange={setPage} />
            </>
          )}
          <div className="panel form-panel">
            <h2>Расскажите свою историю</h2>
            <RequireUser>
              <Form layout="vertical" onFinish={save}>
                <Field
                  name="story"
                  label="Что для вас значит помогать?"
                  max={2000}
                  area
                />
                <Button type="primary" htmlType="submit" loading={busy}>
                  Опубликовать / обновить
                </Button>
              </Form>
              <Button
                className="logout"
                onClick={async () => {
                  try {
                    await api("/stars/me", "DELETE");
                    load.reload();
                    message.success("История снята с публикации");
                  } catch (e) {
                    message.error((e as Error).message);
                  }
                }}
              >
                Снять мою историю с публикации
              </Button>
            </RequireUser>
          </div>
        </section>
      </div>
    </>
  );
}
export function Wishes() {
  const [page, setPage] = useState(1);
  const load = useLoad<Page<Wish>>("/wishes?page=" + (page - 1));
  const { user } = useSession();
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  const [form] = Form.useForm();
  async function act(path: string, body?: any) {
    setBusy(true);
    try {
      await api(path, "POST", body);
      load.reload();
      if (body) form.resetFields();
      message.success("Готово");
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading title="Wishes" />
      <div className="wishes-banner">
        <HeartOutlined />
        <div>
          <h2>Маленькая мечта. Большая поддержка.</h2>
          <p>Поможем желаниям сбыться — вместе.</p>
        </div>
      </div>
      <p className="intro">
        Поддержите чьё-то желание. Его автор подтвердит исполнение, когда помощь
        действительно получена.
      </p>
      <LoadState {...load} retry={load.reload} />
      {!load.loading && !load.error && (
        <>
          {load.data?.items.length ? (
            <div className="request-grid">
              {load.data.items.map((w) => (
                <div className="panel wish-card" key={w.id}>
                  <div className="wish-symbol">
                    <HeartOutlined />
                  </div>
                  <Tag color={w.status === "FULFILLED" ? "green" : "gold"}>
                    {
                      {
                        OPEN: "Ищет поддержку",
                        PLEDGED: "Есть поддержка",
                        FULFILLED: "Исполнено",
                      }[w.status]
                    }
                  </Tag>
                  <h2>{w.title}</h2>
                  <p className="body-text">{w.description}</p>
                  {w.status === "OPEN" &&
                    w.authorId !== user?.id &&
                    (user ? (
                      <Button
                        loading={busy}
                        onClick={() => act("/wishes/" + w.id + "/pledge")}
                      >
                        Поддержать желание
                      </Button>
                    ) : (
                      <Link to="/login">Войти, чтобы поддержать</Link>
                    ))}
                  {w.status === "PLEDGED" && w.authorId === user?.id && (
                    <Button
                      loading={busy}
                      type="primary"
                      onClick={() => act("/wishes/" + w.id + "/fulfill")}
                    >
                      Подтвердить исполнение
                    </Button>
                  )}
                  {w.supporterId === user?.id && (
                    <p className="subtle">Вы поддержали это желание</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <NoData text="Пока нет желаний. О чём мечтаете вы?" />
          )}
          <Pager page={page} total={load.data?.total} onChange={setPage} />
        </>
      )}
      <div className="panel form-panel">
        <h2>Поделиться желанием</h2>
        <RequireUser>
          <Form
            form={form}
            layout="vertical"
            onFinish={(v) => act("/wishes", v)}
          >
            <Field name="title" label="Моё желание" />
            <Field
              name="description"
              label="Расскажите подробнее"
              max={3000}
              area
            />
            <Button type="primary" htmlType="submit" loading={busy}>
              Опубликовать
            </Button>
          </Form>
        </RequireUser>
      </div>
    </>
  );
}
export function Auctions() {
  const [page, setPage] = useState(1);
  const load = useLoad<Page<Lot>>("/auctions?page=" + (page - 1));
  return (
    <>
      <p className="eyebrow">ОСОБЕННЫЕ ВЕЩИ · ДОБРЫЕ ДЕЛА</p>
      <div className="section-heading">
        <h1>Благотворительные аукционы</h1>
        <Link to="/auctions/new">
          <Button type="primary">Создать лот</Button>
        </Link>
      </div>
      <AuctionNotice />
      <LoadState {...load} retry={load.reload} />
      {!load.loading && !load.error && (
        <>
          {load.data?.items.length ? (
            <div className="request-grid">
              {load.data.items.map((l) => (
                <Link
                  className="request-card auction-card"
                  key={l.id}
                  to={"/auctions/" + l.id}
                >
                  <div className="lot-art">
                    <HeartOutlined />
                    <span>ДОБРО СО СМЫСЛОМ</span>
                  </div>
                  <Tag>{lotStatus(l)}</Tag>
                  <h2>{l.title}</h2>
                  <p>{l.celebrity}</p>
                  <p className="price">{money(l.currentPrice)}</p>
                  <div className="card-bottom">
                    <span>До {date(l.endsAt)}</span>
                    <ArrowRightOutlined />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <NoData text="Лотов пока нет. Все опубликованные лоты появятся здесь." />
          )}
          <Pager page={page} total={load.data?.total} onChange={setPage} />
        </>
      )}
    </>
  );
}
function AuctionNotice() {
  return (
    <Alert
      className="auction-notice"
      type="info"
      showIcon
      message="Учебные аукционы — без оплаты"
      description="Принадлежность вещей знаменитостям и благотворительные получатели указываются авторами и пока не проверяются. Ставки не списывают деньги."
    />
  );
}
function lotStatus(l: Lot) {
  return l.closed || Date.now() >= Date.parse(l.endsAt)
    ? "Завершён"
    : Date.now() < Date.parse(l.startsAt)
      ? "Скоро начнётся"
      : "Принимаем ставки";
}
export function NewAuction() {
  return (
    <RequireUser>
      <LotForm />
    </RequireUser>
  );
}
function LotForm() {
  const [busy, setBusy] = useState(false);
  const { message } = App.useApp();
  const navigate = useNavigate();
  async function submit(v: any) {
    setBusy(true);
    try {
      const l = await api<Lot>("/auctions", "POST", {
        ...v,
        startsAt: new Date(v.startsAt).toISOString(),
        endsAt: new Date(v.endsAt).toISOString(),
      });
      navigate("/auctions/" + l.id);
    } catch (e) {
      message.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/auctions">
        ← К аукционам
      </Link>
      <h1>Новая история вещи</h1>
      <AuctionNotice />
      <div className="panel form-panel">
        <Form layout="vertical" onFinish={submit}>
          <Field name="title" label="Название лота" />
          <Field
            name="description"
            label="Описание и происхождение вещи"
            max={5000}
            area
          />
          <Field name="celebrity" label="Имя знаменитости (заявление автора)" />
          <Field name="charity" label="Благотворительная цель" max={200} />
          <Form.Item
            name="startPrice"
            label="Стартовая цена, ₸"
            rules={[{ required: true, message: "Укажите цену" }]}
          >
            <InputNumber min={0.01} max={999999999999.99} precision={2} />
          </Form.Item>
          <Form.Item
            name="startsAt"
            label="Начало (ваше местное время)"
            rules={[{ required: true, message: "Укажите время" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="endsAt"
            label="Окончание (ваше местное время)"
            rules={[{ required: true, message: "Укажите время" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Опубликовать лот
          </Button>
        </Form>
      </div>
    </>
  );
}
export function AuctionDetail() {
  const { id } = useParams();
  const { user } = useSession();
  const load = useLoad<Lot>("/auctions/" + id);
  const history = useLoad<Page<any>>("/auctions/" + id + "/bids");
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => {
      load.reload();
      history.reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [load.reload, history.reload]);
  async function bid(v: any) {
    setBusy(true);
    try {
      await api("/auctions/" + id + "/bids", "POST", v);
      load.reload();
      history.reload();
      message.success("Ставка принята");
    } catch (e) {
      message.error((e as Error).message);
      load.reload();
    } finally {
      setBusy(false);
    }
  }
  const l = load.data;
  return (
    <>
      <Link className="back-link" to="/auctions">
        ← К аукционам
      </Link>
      <AuctionNotice />
      {!l && <LoadState {...load} retry={load.reload} />}{" "}
      {l && (
        <div className="panel detail">
          {load.error && <Alert type="warning" message={load.error} />}
          <Tag color="green">{lotStatus(l)}</Tag>
          <h1>{l.title}</h1>
          <p className="intro">{l.celebrity}</p>
          <p className="body-text">{l.description}</p>
          <p>Цель: {l.charity}</p>
          <p>
            Начало: {date(l.startsAt)} · Окончание: {date(l.endsAt)}
          </p>
          <p className="price">{money(l.currentPrice)}</p>
          {l.closed ? (
            <Alert
              type="success"
              message={
                l.winnerId
                  ? "Победитель: участник №" +
                    l.winnerId +
                    (l.winnerId === user?.id ? " — это вы!" : "")
                  : "Аукцион завершён без ставок"
              }
            />
          ) : Date.now() >= Date.parse(l.endsAt) ? (
            <Alert message="Срок завершён. Определяем победителя…" />
          ) : Date.now() < Date.parse(l.startsAt) ? (
            <Alert message="Ставки откроются в указанное время" />
          ) : l.sellerId === user?.id ? (
            <Alert message="Это ваш лот. Ставки доступны другим участникам." />
          ) : (
            <RequireUser>
              <Form layout="vertical" onFinish={bid}>
                <Form.Item
                  name="amount"
                  label="Ваша ставка, ₸"
                  rules={[{ required: true, message: "Введите сумму" }]}
                >
                  <InputNumber
                    aria-label="Ваша ставка"
                    min={Number(l.currentPrice) + 0.01}
                    max={999999999999.99}
                    precision={2}
                  />
                </Form.Item>
                <Button
                  type="primary"
                  loading={busy}
                  htmlType="submit"
                  disabled={!!load.error}
                >
                  Сделать ставку
                </Button>
              </Form>
            </RequireUser>
          )}
          <h2>Последние ставки</h2>
          {history.error && <Alert message={history.error} type="error" />}
          {history.data?.items.length ? (
            <div>
              {history.data.items.map((b) => (
                <div className="bid-row" key={b.id}>
                  <span>Участник №{b.bidderId}</span>
                  <strong>{money(b.amount)}</strong>
                  <small>{date(b.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="subtle">Ставок пока нет</p>
          )}
        </div>
      )}
    </>
  );
}

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
      message.success("Story published");
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
          <h2 className="section-title">Stories of kindness</h2>
          <p className="intro">
            Stories from Qoldau members. Share what inspires you to help.
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
                <NoData text="No stories yet. Share yours." />
              )}
              <Pager page={page} total={load.data?.total} onChange={setPage} />
            </>
          )}
          <div className="panel form-panel">
            <h2>Share your story</h2>
            <RequireUser>
              <Form layout="vertical" onFinish={save}>
                <Field
                  name="story"
                  label="What does helping mean to you?"
                  max={2000}
                  area
                />
                <Button type="primary" htmlType="submit" loading={busy}>
                  Publish / update
                </Button>
              </Form>
              <Button
                className="logout"
                onClick={async () => {
                  try {
                    await api("/stars/me", "DELETE");
                    load.reload();
                    message.success("Story unpublished");
                  } catch (e) {
                    message.error((e as Error).message);
                  }
                }}
              >
                Unpublish my story
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
      message.success("Done");
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
          <h2>Small dream. Big support.</h2>
          <p>Make wishes come true together.</p>
        </div>
      </div>
      <p className="intro">
        Support a wish. Its author will confirm fulfilment when help has been
        received.
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
                        OPEN: "Seeking support",
                        PLEDGED: "Supported",
                        FULFILLED: "Fulfilled",
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
                        Support wish
                      </Button>
                    ) : (
                      <Link to="/login">Sign in to support</Link>
                    ))}
                  {w.status === "PLEDGED" && w.authorId === user?.id && (
                    <Button
                      loading={busy}
                      type="primary"
                      onClick={() => act("/wishes/" + w.id + "/fulfill")}
                    >
                      Confirm fulfilment
                    </Button>
                  )}
                  {w.supporterId === user?.id && (
                    <p className="subtle">You supported this wish</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <NoData text="No wishes yet. What is your wish?" />
          )}
          <Pager page={page} total={load.data?.total} onChange={setPage} />
        </>
      )}
      <div className="panel form-panel">
        <h2>Share a wish</h2>
        <RequireUser>
          <Form
            form={form}
            layout="vertical"
            onFinish={(v) => act("/wishes", v)}
          >
            <Field name="title" label="My wish" />
            <Field name="description" label="Tell us more" max={3000} area />
            <Button type="primary" htmlType="submit" loading={busy}>
              Publish
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
      <p className="eyebrow">SPECIAL ITEMS · GOOD DEEDS</p>
      <div className="section-heading">
        <h1>Charity auctions</h1>
        <Link to="/auctions/new">
          <Button type="primary">Create lot</Button>
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
                    <span>GIVING WITH PURPOSE</span>
                  </div>
                  <Tag>{lotStatus(l)}</Tag>
                  <h2>{l.title}</h2>
                  <p>{l.celebrity}</p>
                  <p className="price">{money(l.currentPrice)}</p>
                  <div className="card-bottom">
                    <span>Until {date(l.endsAt)}</span>
                    <ArrowRightOutlined />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <NoData text="No lots yet. Published lots will appear here." />
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
      message="Payments are not available"
      description="Celebrity ownership and charitable recipients are stated by sellers and are not verified. Bids do not charge money."
    />
  );
}
function lotStatus(l: Lot) {
  return l.closed || Date.now() >= Date.parse(l.endsAt)
    ? "Ended"
    : Date.now() < Date.parse(l.startsAt)
      ? "Starting soon"
      : "Accepting bids";
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
        ← Back to auctions
      </Link>
      <h1>Create a new lot</h1>
      <AuctionNotice />
      <div className="panel form-panel">
        <Form layout="vertical" onFinish={submit}>
          <Field name="title" label="Lot title" />
          <Field
            name="description"
            label="Description and provenance"
            max={5000}
            area
          />
          <Field name="celebrity" label="Celebrity name (seller claim)" />
          <Field name="charity" label="Charitable purpose" max={200} />
          <Form.Item
            name="startPrice"
            label="Starting price, ₸"
            rules={[{ required: true, message: "Enter a price" }]}
          >
            <InputNumber min={0.01} max={999999999999.99} precision={2} />
          </Form.Item>
          <Form.Item
            name="startsAt"
            label="Start (your local time)"
            rules={[{ required: true, message: "Enter a time" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item
            name="endsAt"
            label="End (your local time)"
            rules={[{ required: true, message: "Enter a time" }]}
          >
            <Input type="datetime-local" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={busy}>
            Publish lot
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
      message.success("Bid accepted");
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
        ← Back to auctions
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
          <p>Purpose: {l.charity}</p>
          <p>
            Start: {date(l.startsAt)} · End: {date(l.endsAt)}
          </p>
          <p className="price">{money(l.currentPrice)}</p>
          {l.closed ? (
            <Alert
              type="success"
              message={
                l.winnerId
                  ? "Winner: member #" +
                    l.winnerId +
                    (l.winnerId === user?.id ? " — that is you!" : "")
                  : "Auction ended without bids"
              }
            />
          ) : Date.now() >= Date.parse(l.endsAt) ? (
            <Alert message="Bidding has ended. Determining the winner…" />
          ) : Date.now() < Date.parse(l.startsAt) ? (
            <Alert message="Bidding opens at the scheduled time" />
          ) : l.sellerId === user?.id ? (
            <Alert message="This is your lot. Other members can place bids." />
          ) : (
            <RequireUser>
              <Form layout="vertical" onFinish={bid}>
                <Form.Item
                  name="amount"
                  label="Your bid, ₸"
                  rules={[{ required: true, message: "Enter an amount" }]}
                >
                  <InputNumber
                    aria-label="Your bid"
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
                  Place bid
                </Button>
              </Form>
            </RequireUser>
          )}
          <h2>Latest bids</h2>
          {history.error && <Alert message={history.error} type="error" />}
          {history.data?.items.length ? (
            <div>
              {history.data.items.map((b) => (
                <div className="bid-row" key={b.id}>
                  <span>Member #{b.bidderId}</span>
                  <strong>{money(b.amount)}</strong>
                  <small>{date(b.createdAt)}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="subtle">No bids yet</p>
          )}
        </div>
      )}
    </>
  );
}

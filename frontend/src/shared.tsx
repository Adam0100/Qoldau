import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
} from "react";
import { Alert, Button, Empty, Spin, Form, Input } from "antd";
import { Link } from "react-router-dom";
import { api, User } from "./api";
export const Session = createContext<{
  user: User | null;
  refresh: () => Promise<void>;
}>({ user: null, refresh: async () => {} });
export const useSession = () => useContext(Session);
export function useLoad<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((x) => x + 1), []);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api<T>(path)
      .then((x) => {
        if (active) setData(x);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, revision]);
  return { data, error, loading, reload };
}
export function LoadState({
  loading,
  error,
  retry,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
}) {
  return loading ? (
    <div className="loading">
      <Spin />
    </div>
  ) : error ? (
    <Alert
      type="error"
      showIcon
      message={error}
      action={<Button onClick={retry}>Retry</Button>}
    />
  ) : null;
}
export function NoData({
  text = "Nothing here yet. Be the first to post.",
}: {
  text?: string;
}) {
  return (
    <div className="empty">
      <Empty description={text} />
    </div>
  );
}
export function RequireUser({ children }: { children: React.ReactNode }) {
  const { user } = useSession();
  return user ? (
    <>{children}</>
  ) : (
    <div className="panel">
      <h2>Let us get to know you</h2>
      <p>Sign in to post requests and support others.</p>
      <Link to="/login">
        <Button type="primary">Sign in or register</Button>
      </Link>
    </div>
  );
}
export function Field({
  name,
  label,
  max = 120,
  area = false,
}: {
  name: string;
  label: string;
  max?: number;
  area?: boolean;
}) {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[
        { required: true, whitespace: true, message: "This field is required" },
        { max, message: "Text is too long" },
      ]}
    >
      {area ? (
        <Input.TextArea rows={4} maxLength={max} showCount />
      ) : (
        <Input maxLength={max} />
      )}
    </Form.Item>
  );
}
export const categories = [
  { value: "EVERYDAY", label: "Everyday help" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "EDUCATION", label: "Education" },
  { value: "OTHER", label: "Other" },
];
export const categoryName = (value: string) =>
  categories.find((x) => x.value === value)?.label || value;
export const statusName = (value: string) =>
  ({
    OPEN: "Open",
    IN_PROGRESS: "In progress",
    COMPLETED: "Completed",
    CLOSED: "Cancelled",
    CANCELLED: "Cancelled",
    PENDING: "Pending",
    SELECTED: "Selected",
    NOT_SELECTED: "Not selected",
  })[value] || value;
export const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 2,
  }).format(value);
export const date = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

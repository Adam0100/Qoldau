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
      action={<Button onClick={retry}>Повторить</Button>}
    />
  ) : null;
}
export function NoData({
  text = "Пока здесь тихо. Первая запись может быть вашей.",
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
      <h2>Давайте познакомимся</h2>
      <p>Войдите, чтобы публиковать просьбы и поддерживать других.</p>
      <Link to="/login">
        <Button type="primary">Войти или зарегистрироваться</Button>
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
        { required: true, whitespace: true, message: "Заполните поле" },
        { max, message: "Слишком длинный текст" },
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
  { value: "EVERYDAY", label: "Повседневная помощь" },
  { value: "TRANSPORT", label: "Транспорт" },
  { value: "EDUCATION", label: "Обучение" },
  { value: "OTHER", label: "Другое" },
];
export const categoryName = (value: string) =>
  categories.find((x) => x.value === value)?.label || value;
export const money = (value: number) =>
  new Intl.NumberFormat("ru-KZ", {
    style: "currency",
    currency: "KZT",
    maximumFractionDigits: 2,
  }).format(value);
export const date = (value: string) =>
  new Date(value).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

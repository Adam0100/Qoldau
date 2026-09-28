import { Link } from "react-router-dom";
import { Button } from "antd";
import { BrandMark, Leafscape } from "./design";
export default function Welcome() {
  return (
    <section className="welcome-screen">
      <Leafscape />
      <div className="welcome-identity">
        <BrandMark />
        <h1>Qoldau+</h1>
        <p>Help today. Bigger tomorrow.</p>
      </div>
      <div className="welcome-actions">
        <Link to="/login?mode=register">
          <Button type="primary" block>
            Get started
          </Button>
        </Link>
        <Link to="/login">
          <Button block>Log in</Button>
        </Link>
        <Link className="welcome-browse" to="/requests">
          Посмотреть просьбы
        </Link>
      </div>
    </section>
  );
}

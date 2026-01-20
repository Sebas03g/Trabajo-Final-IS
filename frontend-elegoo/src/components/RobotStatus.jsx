import { useEffect, useState } from "react";
import axios from "axios";

export default function RobotStatus() {
  const [status, setStatus] = useState("IDLE");

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await axios.get("http://localhost:3000/api/status");
      setStatus(res.data.state);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-blue-100 rounded-lg">
      🤖 Estado del robot: <strong>{status}</strong>
    </div>
  );
}

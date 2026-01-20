import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883");

client.on("connect", () => {
  console.log("📡 MQTT conectado");
});

export const publishRoute = async (route) => {
  client.publish(
    "elegoo/route",
    JSON.stringify(route),
    { qos: 1 }
  );
};
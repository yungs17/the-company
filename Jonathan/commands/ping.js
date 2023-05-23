const ping = async ({ ack }) => {
  await ack();
  console.log("ping received " + Date.now());
};

export default ping;

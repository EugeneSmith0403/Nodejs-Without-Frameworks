const amqp = require("amqplib/callback_api");

export class RabbitMq {
  public static sendMessageToQueue(queueName: string, msg: string) {
    amqp.connect(
      process.env.rabbit_mg_url,
      function (error0: any, connection: any) {
        if (error0) {
          throw error0;
        }
        connection.createChannel(function (error1: any, channel: any) {
          if (error1) {
            throw error1;
          }

          channel.assertQueue(queueName, {
            durable: false,
          });

          channel.sendToQueue(queueName, Buffer.from(msg));
          console.log(" [x] Sent %s", msg);
        });

        setTimeout(() => {
          connection.close();
        }, 500);
      }
    );
  }
}

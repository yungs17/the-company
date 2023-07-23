class SlackHandler {
  constructor(app) {
    this.app = app;
  }

  async findConversation(name) {
    try {
      const result = await this.app.client.conversations.list({
        token: process.env.SLACK_BOT_TOKEN,
      });

      let conversationId = "";

      for (const channel of result.channels) {
        if (channel.name === name) {
          conversationId = channel.id;
        }
      }

      return conversationId;
    } catch (err) {
      console.error(err);
    }
  }

  async publishText(channelId, text) {
    try {
      const result = await this.app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text,
            },
          },
        ],
        text: "A message from Jonathan",
      });

      return result;
    } catch (err) {
      console.error(err);
    }
  }

  async publishMessage(channelId, chatBlock, attachmentsBlock) {
    try {
      const result = await this.app.client.chat.postMessage({
        token: process.env.SLACK_BOT_TOKEN,
        channel: channelId,
        blocks: chatBlock,
        attachments: attachmentsBlock,
        text: "A message from Jonathan",
      });

      return result;
    } catch (err) {
      console.error(err);
    }
  }

  createChatBlockChannelAlarm() {
    const chatBlock = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "@channel",
        },
      },
    ];
    return chatBlock;
  }

  createChatAttachment(contentText, colorHexCode) {
    const attachmentsBlock = [
      {
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: contentText,
            },
          },
        ],
        color: colorHexCode,
      },
    ];
    return attachmentsBlock;
  }
}

export default SlackHandler;

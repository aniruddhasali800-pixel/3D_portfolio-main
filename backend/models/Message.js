import mongoose from "mongoose";

const replySchema = new mongoose.Schema({
  body: {
    type: String,
    required: true,
  },
  repliedAt: {
    type: Date,
    default: Date.now,
  },
});

const messageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  attachments: [
    {
      filename: String,
      path: String,
      contentType: String,
    },
  ],
  isRead: {
    type: Boolean,
    default: false,
  },
  replies: [replySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Message = mongoose.model("Message", messageSchema);

export default Message;

// /**
//  * https://core.telegram.org/bots/api
//  *
//
// describe('TelegramApi', () => {
//   it('sendTextMessage', async () => {
//     const telegram = new TelegramApi(TELEGRAM_NOTIFY_BOT_TOKEN!);
//     const body = await telegram.sendTextMessage(
//       'sendTextMessage demo, ' + new Date(),
//       TELEGRAM_NOTIFY_CHAT_ID!
//     );
//     console.log(JSON.stringify(body, null, 2));
//     expect(1).toBe(1);
//   }, 10000);
//   it('sendMessage', async () => {
//     const telegram = new TelegramApi(TELEGRAM_NOTIFY_BOT_TOKEN!);
//     const body = await telegram.sendMessage(
//       'sendMessage demo, ' + new Date(),
//       TELEGRAM_NOTIFY_CHAT_ID!
//     );
//     console.log(JSON.stringify(body, null, 2));
//     expect(1).toBe(1);
//   }, 10000);
//
//   it('sendMessage With inline_keyboard', async () => {
//     const telegram = new TelegramApi(TELEGRAM_NOTIFY_BOT_TOKEN!);
//     const messageText = 'Please choose an option:';
//
//     const buttons = [
//       [{ text: 'Option 1', callback_data: 'option1' }],
//       [{ text: 'Option 2', callback_data: 'option2' }],
//     ];
//     const body = await telegram.sendMessage(
//       messageText,
//       TELEGRAM_NOTIFY_CHAT_ID!,
//       {
//         inline_keyboard: buttons,
//       }
//     );
//     console.log(JSON.stringify(body, null, 2));
//     const { message_id } = body.result;
//     const body1 = await telegram.editMessageText(
//       messageText + ' edited',
//       TELEGRAM_NOTIFY_CHAT_ID!,
//       message_id,
//       {
//         inline_keyboard: [...buttons, ...buttons],
//       }
//     );
//     console.log(JSON.stringify(body1, null, 2));
//
//     expect(1).toBe(1);
//   }, 10000);
//   it('sendMessage With keyboard', async () => {
//     const telegram = new TelegramApi(TELEGRAM_NOTIFY_BOT_TOKEN!);
//     const messageText = 'Please choose an option:';
//
//     const buttons = [
//       ['地址设置', '最新通知'],
//       ['统计分析', 'U换TRX'],
//       ['全局设置'],
//     ];
//     const keyboard = buttons.map((row) =>
//       row.map((button) => ({ text: button }))
//     );
//
//     const body = await telegram.sendMessage(
//       messageText,
//       TELEGRAM_NOTIFY_CHAT_ID!,
//       {
//         keyboard: keyboard,
//         resize_keyboard: true,
//         persistent: true,
//       }
//     );
//     console.log(JSON.stringify(body, null, 2));
//
//     expect(1).toBe(1);
//   }, 10000);
//   ///
// });
//
//  *
//  */
// export default class TelegramApi {
//   private token: string;
//
//   private api: string;
//
//   constructor(token: string) {
//     this.token = token;
//     this.api = `https://api.telegram.org/bot${token}`;
//   }
//
//   async isChatCreator(userId: string, chatId: string) {
//     const data = (await this.getChatMember(chatId, userId)) as any;
//     const memberStatus = data.result.status;
//     return memberStatus === 'creator';
//   }
//
//   async getUserIdFromUsername(username: string) {
//     const response = await fetch(`${this.api}/getChat?chat_id=@${username}`);
//     const res = (await response.json()) as any;
//     if (res.ok && res.result && res.result.id) {
//       return res.result.id;
//     }
//     throw new Error('User not found');
//   }
//
//   async getUserProfilePhotos(userId: string) {
//     const response = await fetch(
//       `${this.api}/getUserProfilePhotos?user_id=${userId}`
//     );
//     return response.json();
//   }
//
//   async getChatMember(chatId: string, userId: string) {
//     const response = await fetch(
//       `${this.api}/getChatMember?chat_id=${chatId}&user_id=${userId}`
//     );
//     return response.json();
//   }
//
//   async sendMessage(
//     text: string,
//     chatId: string|number,
//     replyMarkup?: {
//       resize_keyboard?: boolean;
//       persistent?: boolean;
//       keyboard?: any[][];
//       inline_keyboard?: any[][];
//     },
//     parse_mode?: 'Markdown' | undefined
//   ) {
//     const message = {
//       chat_id: String(chatId),
//       parse_mode,
//       text,
//       reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : undefined,
//     };
//
//     console.log('===>> sendMessage', this.api, message);
//
//     const response = await fetch(`${this.api}/sendMessage`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(message),
//     });
//     console.log('response >>>>', response.ok);
//     const res = await response.json();
//     //console.log('sendMessage', res);
//     return res;
//   }
//
//   async editMessageText(
//     text: string,
//     chatId: string,
//     messageId: number,
//     replyMarkup?: { inline_keyboard: any[][] },
//     parse_mode?: 'Markdown' | undefined
//   ) {
//     const message = {
//       chat_id: chatId,
//       message_id: messageId,
//       parse_mode,
//       text,
//       reply_markup: replyMarkup ? JSON.stringify(replyMarkup) : undefined,
//     };
//
//     //console.log('sendMessage', message);
//
//     const response = await fetch(`${this.api}/editMessageText`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(message),
//     });
//     const res = await response.json();
//     //console.log('sendMessage', res);
//     return res;
//   }
//
//   /**
//    * Upload a document to a Telegram chat.
//    * @param chatId - The ID of the chat where the document should be sent.
//    * @param buf - The Buffer of the document.
//    * @param fileType - The MIME type of the document (e.g., 'application/pdf').
//    * @param filename - The name of the file to upload.
//    * @param caption - (Optional) Caption to include with the document.
//    * @returns The response from the Telegram API.
//    */
//   async sendDocument(
//     chatId: string,
//     buf: Buffer,
//     fileType?: string,
//     filename?: string,
//     caption?: string,
//      replyMarkup?: {
//       resize_keyboard?: boolean;
//       persistent?: boolean;
//       keyboard?: any[][];
//       inline_keyboard?: any[][];
//     },
//   ) {
//     // Set default file type if not provided
//     if (!fileType) {
//       fileType = 'application/octet-stream';
//     }
//
//     const apiUrl = `${this.api}/sendDocument`;
//
//     // Create a Blob from the ArrayBuffer
//     const blob = new Blob([buf], { type: fileType });
//
//     // Create FormData to hold the file and other data
//     const formData = new FormData();
//     formData.append('chat_id', chatId);
//     formData.append('document', blob, filename);
//     if (caption) {
//       formData.append('caption', caption);
//     }
//
//     if(replyMarkup){
//       formData.append('reply_markup',  JSON.stringify(replyMarkup));
//
//     }
//
//
//     // Send the request to the Telegram API
//     const response = await fetch(apiUrl, {
//       method: 'POST',
//       body: formData,
//     });
//
//     // Return the JSON response
//     const res = await response.json();
//     return res;
//   }
//
//   async sendTextMessage(text: string, chatId: string) {
//     text = encodeURIComponent(text);
//     const url = `${this.api}/sendMessage?chat_id=${chatId}&text=${text}`;
//
//     const response = await fetch(
//       url,
//       {
//         method: 'GET',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     const res = await response.json();
//     return res;
//   }
//
//   // async sendAction(action: 'typing') {
//   //   const response = await fetch(
//   //     `${this.api}/sendMessage?chat_id=${chatId}&text=${text}`,
//   //   );
//   //   return await response.json();
//   // }
//
//   // See also: https://core.telegram.org/bots/api#getfile
//   async getFile(fileId: string) {
//     return fetch(`${this.api}/getFile?file_id=${encodeURIComponent(fileId)}`);
//   }
//
//     /**
//    * Fetch a document from Telegram servers using its file_id.
//    * @param fileId - The file_id of the document to fetch.
//    * @returns The binary data (ArrayBuffer) of the document.
//    */
//     async fetchDocument(fileId: string) {
//       // Step 1: Get the file's path using getFile
//       const response = await fetch(`${this.api}/getFile?file_id=${fileId}`);
//       const res = await response.json();
//       if (!res.ok) {
//         throw new Error(`Failed to fetch file info: ${res.description}`);
//       }
//
//       const filePath = res.result.file_path;
//       const fileUrl = `https://api.telegram.org/file/bot${this.token}/${filePath}`;
//       return fileUrl
//     }
//
//   async getFileLink(fileId: string) {
//     const response = await this.getFile(fileId);
//     const res = await response.json();
//     const { ok, result } = res as any;
//     if (ok) {
//       return `https://api.telegram.org/file/bot${this.token}/${result.file_path}`;
//     }
//     return undefined;
//   }
//
//   async getFileData(file_path: string) {
//     return fetch(`https://api.telegram.org/file/bot${this.token}/${file_path}`);
//   }
//
//   // See also: https://core.telegram.org/bots/api#sendvoice
//   async sendVoice(
//     chatId: string,
//     arrayBuffer: ArrayBuffer,
//     fileType?: string,
//     filename?: string
//   ) {
//     if (!fileType) {
//       fileType = 'application/octet-stream';
//     }
//     const apiUrl = `${this.api}/sendVoice`;
//     const blob = new Blob([Buffer.from(arrayBuffer)], {
//       type: fileType,
//     });
//
//     const formData = new FormData();
//     formData.append('chat_id', chatId);
//     formData.append('voice', blob, filename);
//     return fetch(apiUrl, {
//       method: 'POST',
//       body: formData,
//     });
//   }
// }

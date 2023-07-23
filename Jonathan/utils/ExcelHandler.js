import { GoogleSpreadsheet } from "google-spreadsheet";

class ExcelHandler {
  constructor(config) {
    this.privateKey = config.privateKey;
    this.spreadSheetEmail = config.spreadSheetEmail;
    this.spreadSheetId = config.spreadSheetId;
    this.doc = new GoogleSpreadsheet(config.spreadSheetId);
  }

  async addRow(worksheetTitle, rowData) {
    try {
      await this.doc.useServiceAccountAuth({
        client_email: this.spreadSheetEmail,
        private_key: this.privateKey,
      });

      await this.doc.loadInfo();
      const worksheet = this.doc.sheetsByTitle[worksheetTitle];

      const result = await worksheet.addRow(rowData);

      return result;
    } catch (error) {
      console.error(Date() + "\n");
      console.error(error);
    }
  }

  async getLastRow(worksheetTitle) {
    try {
      await this.doc.useServiceAccountAuth({
        client_email: this.spreadSheetEmail,
        private_key: this.privateKey,
      });

      await this.doc.loadInfo();
      const worksheet = this.doc.sheetsByTitle[worksheetTitle];

      const rows = await worksheet.getRows();
      let result = {};
      if (rows.length > 0) {
        result = rows[rows.length - 1];
      } else {
        result = false;
      }

      return result;
    } catch (error) {
      console.error(Date() + "\n");
      console.error(error);
    }
  }
}

export default ExcelHandler;

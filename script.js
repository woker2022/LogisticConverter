const dropbox = document.getElementById("dropbox");
const file_content = document.getElementById("file-content");
let current_file = [];
let fileEncode = "";

const byteArrayheaderTable = {
  big5: new Uint8Array([
    0xad, 0x71, 0xb3, 0xe6, 0xbd, 0x73, 0xb8, 0xb9, 0x2c, 0xb3, 0x66, 0xb9,
    0x42, 0xa4, 0xbd, 0xa5, 0x71, 0x2c, 0xb3, 0x66, 0xb9, 0x42, 0xbd, 0x73,
    0xb8, 0xb9, 0x2c, 0xa5, 0x58, 0xb3, 0x66, 0xae, 0xc9, 0xb6, 0xa1, 0x2c,
    0xb5, 0x6f, 0xb2, 0xbc, 0xb8, 0xb9, 0xbd, 0x58, 0x0d, 0x0a,
  ]),
  utf8: new Uint8Array([
    0xe8, 0xa8, 0x82, 0xe5, 0x96, 0xae, 0xe7, 0xb7, 0xa8, 0xe8, 0x99, 0x9f,
    0x2c, 0xe8, 0xb2, 0xa8, 0xe9, 0x81, 0x8b, 0xe5, 0x85, 0xac, 0xe5, 0x8f,
    0xb8, 0x2c, 0xe8, 0xb2, 0xa8, 0xe9, 0x81, 0x8b, 0xe7, 0xb7, 0xa8, 0xe8,
    0x99, 0x9f, 0x2c, 0xe5, 0x87, 0xba, 0xe8, 0xb2, 0xa8, 0xe6, 0x99, 0x82,
    0xe9, 0x96, 0x93, 0x2c, 0xe7, 0x99, 0xbc, 0xe7, 0xa5, 0xa8, 0xe8, 0x99,
    0x9f, 0xe7, 0xa2, 0xbc, 0x0d, 0x0a,
  ]),
};

function showFileName(file) {
  const infoBox = document.getElementById("file-box");
  infoBox.innerText = file["name"];
}

function setBackgroundNormal() {
  dropbox.classList.add("normal");
  dropbox.classList.remove("dragenter");
}

function setBackgroundDragenter() {
  dropbox.classList.add("dragenter");
  dropbox.classList.remove("normal");
}

function handleFiles(files) {
  // 只抓第一個檔案
  current_file = files[0];
  console.log(current_file);
  showFileName(current_file);
  if (!isLegalFile(current_file)) {
    return;
  }
  setBackgroundNormal();
}

async function click(e) {
  const arrFileHandle = await window.showOpenFilePicker({
    multiple: false,
    types: [
      {
        description: "CSV",
        accept: {
          "text/csv": [".csv"],
        },
      },
    ],
  });

  const files = [];
  for (const fileHandle of arrFileHandle) {
    files.push(await fileHandle.getFile());
  }

  handleFiles(files);
}

function dragenter(e) {
  e.stopPropagation();
  e.preventDefault();
  setBackgroundDragenter();
}

function dragover(e) {
  e.stopPropagation();
  e.preventDefault();
  setBackgroundDragenter();
}

function dragleave(e) {
  e.stopPropagation();
  e.preventDefault();
  setBackgroundNormal();
}

function drop(e) {
  e.stopPropagation();
  e.preventDefault();
  handleFiles(e.dataTransfer.files);
}

function dragend(e) {
  e.stopPropagation();
  e.preventDefault();
  setBackgroundNormal();
}

dropbox.addEventListener("dragenter", dragenter, false);
dropbox.addEventListener("dragover", dragover, false);
dropbox.addEventListener("dragleave", dragleave, false);
dropbox.addEventListener("drop", drop, false);
dropbox.addEventListener("dragend", dragend, false);
dropbox.addEventListener("click", click, false);

// ==========================================================

document.addEventListener("paste", async (e) => {
  // Prevent the default behavior, so you can code your own logic.
  e.preventDefault();
  if (!e.clipboardData.files.length) {
    return;
  }
  handleFiles(e.clipboardData.files);
  current_file = e.clipboardData.files[0];
});

async function showPreview(file) {
  if (file.type.startsWith("text/csv")) {
    file_content.value = await file.text();
  }
}

// ==========================================================

const processBTN = document.getElementById("process-button");
const papaConfig = { header: true };
const fileReader = new FileReader();
let csvData;

function parseAndFilter2DesireStr(parsedCSV) {
  let newStr = "";
  let sucCount = 0;
  for (let i = 0; i < parsedCSV["data"].length; i++) {
    let tempStr = "";
    let row_data = parsedCSV["data"][i];
    let orderNO = row_data["訂單號碼"];
    let logisticNO = row_data["十碼貨號"];
    try {
      if (orderNO.length == 16) {
        tempStr = `${orderNO},,${logisticNO},,\n`;
        sucCount++;
        newStr = newStr + tempStr;
      }
    } catch (e) {
      console.warn(`第${i}筆：${orderNO}`);
    }
  }
  return newStr;
}

function convertUtf8StrToBytes(strUtf) {
  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(strUtf);
  return utf8Bytes;
}

function isLegalFile(file) {
  dropbox.classList.remove("dropbox_warning");
  dropbox.classList.remove("dropbox_pass");
  try {
    if (file.type != "text/csv") {
      console.warn("錯誤檔案格式");
      dropbox.classList.add("dropbox_warning");
      file_content.value = "";
      return false;
    }
  } catch {
    console.log(e);
    dropbox.classList.add("dropbox_warning");
    file_content.value = "";
    return false;
  }
  dropbox.classList.add("dropbox_pass");
  showPreview(current_file);
  return true;
}

function generateFileName() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  return `匯入物流編號${year}${month}${date}${hours}${minutes}${seconds}.csv`;
}

function savefile(data) {
  const blob = new Blob(
    [byteArrayheaderTable[fileEncode], convertUtf8StrToBytes(data)],
    {
      type: "text/csv;",
    }
  );
  const link = document.createElement("a");
  const href = URL.createObjectURL(blob);
  let filename = generateFileName();
  document.body.appendChild(link);
  link.href = href;
  link.id = "csv-file-download";
  link.download = filename;
  link.click();
  setTimeout(function () {
    link.remove();
    console.log("download url remove");
  }, 15000);
}

function getEncodeConfig() {
  var ele = document.getElementsByName("encode");
  for (i = 0; i < ele.length; i++) {
    if (ele[i].checked) {
      fileEncode = ele[i].value;
    }
  }
}

processBTN.addEventListener("click", function () {
  fileReader.onload = function () {
    csvData = fileReader.result;
    let parsedData = Papa.parse(csvData, papaConfig);

    getEncodeConfig();
    console.log(parsedData);
    savefile(parseAndFilter2DesireStr(parsedData));
  };

  if (!isLegalFile(current_file)) {
    return;
  }
  fileReader.readAsText(current_file);
});

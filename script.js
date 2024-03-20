const dropbox = document.getElementById("dropbox");
const file_content = document.getElementById("file-content");
var current_file = [];

function showFileName(file) {
  var infoBox = document.getElementById("file-box");
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
    multiple: true,
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
  if (file.type.startsWith("image/")) {
    // For images, create an image and append it to the `body`.
    const img = document.createElement("img");
    const blob = URL.createObjectURL(file);
    img.src = blob;
    file_content.append(img);
  } else if (file.type.startsWith("text/")) {
    file_content.value = await file.text();
  }
}

// ==========================================================

const processBTN = document.getElementById("process-button");
const papaConfig = { header: true };
const fileReader = new FileReader();
var csvData;

function readAndGenNewCSV(parsedCSV) {
  let newCSV = [["訂單編號", "貨運公司", "貨運編號", "出貨時間", "發票號碼"]];
  for (let i = 0; i < parsedCSV["data"].length; i++) {
    let row_data = parsedCSV["data"][i];
    let orderNO = row_data["訂單號碼"];
    let logisticNO = row_data["十碼貨號"];
    try {
      if (orderNO.length == 16) {
        newCSV.push([orderNO, , logisticNO, ,]);
        console.log(orderNO.length);
      }
    } catch (e) {
      console.warn(`第${i}筆：${orderNO}`);
    }
  }
  console.info("轉換完成資料總數：", newCSV.length);
  return Papa.unparse(newCSV);
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
  const blob = new Blob([data], { type: "text/csv;charset=big5" });
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

processBTN.addEventListener("click", function () {
  fileReader.onload = function () {
    csvData = fileReader.result;

    let parsedData = Papa.parse(csvData, papaConfig);
    console.log(parsedData);
    savefile(readAndGenNewCSV(parsedData));
  };

  if (!isLegalFile(current_file)) {
    return;
  }

  fileReader.readAsText(current_file);
});

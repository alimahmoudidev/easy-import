import fs from "fs";

const address = process.argv[2];
const addressFileIndex = `${address}/index.js`;

// Delete Old File Created
function deletePreviousFile(addressFileIndex) {
  fs.unlink(addressFileIndex, (err) => {
    if (err) {
      if (err.code == "ENOENT") {
        console.log("The file did not exist");
      } else {
        console.log(err);
      }
      return;
    }
    console.log("Delete the previous file");
  });
}

// Read files in path
async function readAllFile(path) {
  const list = [];
  const files = await new Promise((resolve, reject) => {
    fs.opendir(path, (err, dir) => {
      if (err) reject(err);
      const readNext = () => {
        dir.read((err, file) => {
          if (err) reject(err);
          if (file === null) {
            resolve(list);
            return;
          }
          const filePath = path + "/" + file.name;
          if (file.isDirectory()) {
            readAllFile(filePath).then((files) => {
              list.push(...files);
              readNext();
            });
          } else {
            list.push(removeFirstSrc(filePath));
            readNext();
          }
        });
      };
      readNext();
    });
  });
  return files;
}

// Create Name File Camel Case
function beautifulName(fileName) {
  let newName = fileName.replaceAll("-", " ").replaceAll("_", " ");
  const beaUName = newName.split(" ");
  beaUName.forEach((partName, i) => {
    if (i == 0) return;
    if (partName.length == 1) beaUName[i] = partName.toUpperCase();
    beaUName[i] =
      partName[0].toUpperCase() + partName.slice(1, partName.length);
  });
  return beaUName.join("");
}

// Find Name File in path File
function getNameFile(srcFile) {
  let fileName = srcFile.split("/").pop().split(".");
  fileName.pop();
  fileName = fileName.join("");
  return beautifulName(fileName);
}

// Create File index
function createFileText(objFile) {
  const arryImport = [];
  for (const key in objFile) {
    if (Object.hasOwnProperty.call(objFile, key)) {
      arryImport.push(`import ${key} from '${objFile[key]}'`);
    }
  }
  const objExport = Object.keys(objFile);
  let obj = "{";
  objExport.forEach((key) => {
    obj += `${key},`;
  });
  obj += "}";
  console.log(obj);
  arryImport.push(`const img = ${obj}`);
  arryImport.push("export default img");
  return arryImport;
}

function removeFirstSrc(fileSrc) {
  return `.${fileSrc.split(address)[1]}`;
}

// Delete
deletePreviousFile(addressFileIndex);
// Run Code
readAllFile(address)
  // Create Object Files
  .then((list) => {
    const objSrcFile = {};
    list.map((srcFile) => {
      let fileName = getNameFile(srcFile);
      if (objSrcFile[fileName] !== undefined) {
        const folder = srcFile.split("/");
        fileName = `${folder[folder.length - 2]}_${fileName}`;
      }
      objSrcFile[fileName] = srcFile;
    });
    return objSrcFile;
  })
  // Add To File Index js
  .then((objSrcFile) => {
    const importObj = createFileText(objSrcFile);
    importObj.forEach((line) => {
      fs.appendFile(addressFileIndex, `\n${line}`, (err) => {
        if (err) {
          console.log(err);
          return;
        }
      });
    });
  });

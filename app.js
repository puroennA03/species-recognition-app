const camera = document.getElementById("camera");

const snapshotCanvas = document.getElementById("snapshotCanvas");

const uploadInput = document.getElementById("uploadInput");

const captureButton = document.getElementById("captureButton");

const uploadButton = document.getElementById("uploadButton");

const identifyButton = document.getElementById("identifyButton");

const resultsDiv = document.getElementById("results");



let selectedImage = null;

let mobilenetModel = null;



// 日本語ラベリングマップ

const labelMap = {

    "bullfrog": "ウシガエル",

    "Coat-of-Mail-Shell": "ヒザラガイ",

    "grasshopper": "バッタ",

    "jellyfish": "クラゲ",

    "red fox": "アカギツネ",

    "badger": "アナグマ",

    "wood rabbit": "野ウサギ",

    "spoonbill": "ヘラサギ"

};



// 初期化：MobileNetモデルをロード

async function init() {

    mobilenetModel = await mobilenet.load();

    console.log("MobileNetモデルがロードされました。");

}

init();



// アップロードボタンイベント

uploadButton.addEventListener("click", () => {

    uploadInput.click();

});



// カメラ起動

captureButton.addEventListener("click", async () => {

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    camera.srcObject = stream;

    camera.hidden = false;

    snapshotCanvas.hidden = false;

});



// 写真撮影

camera.addEventListener("click", () => {

    const context = snapshotCanvas.getContext("2d");

    snapshotCanvas.width = camera.videoWidth;

    snapshotCanvas.height = camera.videoHeight;

    context.drawImage(camera, 0, 0);

    selectedImage = snapshotCanvas.toDataURL("image/jpeg");

    resultsDiv.innerHTML = "<p>写真が選択されました。</p>";

    stopCamera();

});



// カメラ停止

function stopCamera() {

    const stream = camera.srcObject;

    if (stream) {

        const tracks = stream.getTracks();

        tracks.forEach(track => track.stop());

    }

    camera.hidden = true;

}



// ファイルアップロード

uploadInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = () => {

        selectedImage = reader.result;

        resultsDiv.innerHTML = "<p>ファイルが選択されました。</p>";

    };

    reader.readAsDataURL(file);

});



// 識別ボタン

identifyButton.addEventListener("click", async () => {

    if (!selectedImage) {

        resultsDiv.innerHTML = "<p>画像を選択してください。</p>";

        return;

    }



    resultsDiv.innerHTML = "<p>識別中...</p>";



    // MobileNetで識別

    const imageElement = new Image();

    imageElement.src = selectedImage;

    imageElement.onload = async () => {

        const predictions = await mobilenetModel.classify(imageElement);

        if (predictions.length > 0) {

            const topPrediction = predictions[0].className;



            // 日本語ラベリング適用

            const japaneseLabel = labelMap[topPrediction] || "ラベルなし";



            // 結果を表示

            resultsDiv.innerHTML = `

                <h2>識別結果</h2>

                <p>名前（英語）: ${topPrediction}</p>

                <p>名前（日本語）: ${japaneseLabel}</p>

                <button id="correctButton">間違っていますか？</button>

            `;



            // 再学習用ボタンのイベント

            document.getElementById("correctButton").addEventListener("click", () => {

                displayCorrectionInterface(topPrediction);

            });

        } else {

            resultsDiv.innerHTML = "<p>識別結果が見つかりません。</p>";

        }

    };

});



// 修正インターフェースを表示

function displayCorrectionInterface(currentLabel) {

    resultsDiv.innerHTML += `

        <div id="correctionForm">

            <p>正しい名前を入力してください:</p>

            <input type="text" id="newLabel" placeholder="正しい名前">

            <button id="submitCorrection">送信</button>

        </div>

    `;



    document.getElementById("submitCorrection").addEventListener("click", () => {

        const newLabel = document.getElementById("newLabel").value;

        if (newLabel) {

            trainModel(currentLabel, newLabel);

        }

    });

}



// 再学習処理

function trainModel(oldLabel, newLabel) {

    // ラベルマッピングを更新

    labelMap[oldLabel] = newLabel;

    console.log(`モデルを再学習: ${oldLabel} -> ${newLabel}`);



    // ユーザー通知

    resultsDiv.innerHTML = `

        <p>再学習完了: ${oldLabel} の新しいラベルは ${newLabel} です。</p>

    `;

}
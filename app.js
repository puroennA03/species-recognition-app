const camera = document.getElementById("camera");

const snapshotCanvas = document.getElementById("snapshotCanvas");

const uploadInput = document.getElementById("uploadInput");

const captureButton = document.getElementById("captureButton");

const uploadButton = document.getElementById("uploadButton");

const identifyButton = document.getElementById("identifyButton");

const resultsDiv = document.getElementById("results");



let selectedImage = null;

let originalPrediction = null; // 最初の識別結果を保存

let originalEnglishName = null; // 英語名を保存



// アップロードボタンでファイル選択

uploadButton.addEventListener("click", () => uploadInput.click());



// カメラ起動

captureButton.addEventListener("click", async () => {

    const stream = await navigator.mediaDevices.getUserMedia({ video: true });

    camera.srcObject = stream;

    camera.hidden = false;

    snapshotCanvas.hidden = false;

});



// 写真撮影

camera.addEventListener("click", () => {

    captureSnapshot();

    stopCamera();

});



// カメラ停止

function stopCamera() {

    const stream = camera.srcObject;

    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());

    camera.hidden = true;

}



// 写真をキャンバスに描画

function captureSnapshot() {

    const context = snapshotCanvas.getContext("2d");

    snapshotCanvas.width = camera.videoWidth;

    snapshotCanvas.height = camera.videoHeight;

    context.drawImage(camera, 0, 0);

    selectedImage = snapshotCanvas.toDataURL("image/jpeg");

    resultsDiv.innerHTML = "<p>写真が選択されました。</p>";

}



// ファイルアップロード処理

uploadInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    const reader = new FileReader();

    reader.onload = () => {

        selectedImage = reader.result;

        resultsDiv.innerHTML = "<p>ファイルが選択されました。</p>";

    };

    reader.readAsDataURL(file);

});



// 識別処理

identifyButton.addEventListener("click", async () => {

    if (!selectedImage) {

        resultsDiv.innerHTML = "<p>画像を選択してください。</p>";

        return;

    }



    resultsDiv.innerHTML = "<p>識別中...</p>";

    try {

        const model = await mobilenet.load();

        console.log("MobileNet model loaded.");

        

        const imageElement = new Image();

        imageElement.src = selectedImage;

        

        imageElement.onload = async () => {

            console.log("Image loaded, starting classification...");

            const predictions = await model.classify(imageElement);

            console.log("Predictions:", predictions);

            originalPrediction = predictions[0].className;  // 最初の識別結果を保存

            originalEnglishName = originalPrediction; // 英語名も保存

            displayIdentificationResults(predictions);

        };

    } catch (err) {

        console.error("識別中にエラーが発生しました: ", err);

        resultsDiv.innerHTML = "<p>識別中にエラーが発生しました。</p>";

    }

});



// 識別結果表示

async function displayIdentificationResults(predictions) {

    if (predictions.length > 0) {

        const topPrediction = predictions[0].className;

        const translatedPrediction = await translateToJapanese(topPrediction);

        resultsDiv.innerHTML = `

            <h2>識別結果</h2>

            <p>英語名: ${topPrediction}</p>

            <p>日本語名: ${translatedPrediction}</p>

            <button id="correctButton">間違っていますか？</button>

        `;



        document.getElementById("correctButton").addEventListener("click", () => {

            displayCorrectionInterface(topPrediction);

        });

    } else {

        resultsDiv.innerHTML = "<p>識別結果が見つかりません。</p>";

    }

}



// 修正インターフェース表示

function displayCorrectionInterface(currentLabel) {

    resultsDiv.innerHTML += `

        <div id="correctionForm">

            <p>正しい日本語名を入力してください:</p>

            <input type="text" id="newLabel" placeholder="正しい日本語名">

            <button id="submitCorrection">送信</button>

        </div>

    `;



    document.getElementById("submitCorrection").addEventListener("click", () => {

        const newLabel = document.getElementById("newLabel").value;

        if (newLabel) {

            updateJapaneseLabel(newLabel); // 日本語名だけ更新

        }

    });

}



// 日本語名の更新

function updateJapaneseLabel(newJapaneseLabel) {

    const englishLabel = originalEnglishName;  // 最初の英語名を保持

    resultsDiv.innerHTML = `

        <h2>識別結果</h2>

        <p>英語名: ${englishLabel}</p>

        <p>日本語名: ${newJapaneseLabel}</p>

    `;

    console.log(`日本語名を更新: ${englishLabel} -> ${newJapaneseLabel}`);

}



// 翻訳処理

async function translateToJapanese(text) {

    try {

        const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`);

        return response.data.responseData.translatedText || "翻訳エラー";

    } catch (err) {

        console.error("翻訳エラー: ", err);

        return "翻訳エラー";

    }

}
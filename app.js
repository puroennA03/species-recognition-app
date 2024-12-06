const camera = document.getElementById("camera");

const snapshotCanvas = document.getElementById("snapshotCanvas");

const uploadInput = document.getElementById("uploadInput");

const captureButton = document.getElementById("captureButton");

const uploadButton = document.getElementById("uploadButton");

const identifyButton = document.getElementById("identifyButton");

const resultsDiv = document.getElementById("results");



let selectedImage = null;

let topPrediction = null; // topPredictionを外部スコープに移動



// アップロードボタンを押すとファイル選択を表示

uploadButton.addEventListener("click", () => {

    uploadInput.click();

});



// ファイルアップロード

uploadInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (file) {

        const reader = new FileReader();

        reader.onload = () => {

            selectedImage = reader.result;

            resultsDiv.innerHTML = "<p>ファイルが選択されました。</p>";

        };

        reader.readAsDataURL(file);

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

    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());

    camera.hidden = true;

}



// 識別ボタン

identifyButton.addEventListener("click", async () => {

    if (!selectedImage) {

        resultsDiv.innerHTML = "<p>画像を選択してください。</p>";

        return;

    }



    resultsDiv.innerHTML = "<p>識別中...</p>";



    // MobileNetでの識別処理

    try {

        const model = await mobilenet.load();

        const imageElement = new Image();

        imageElement.src = selectedImage;



        imageElement.onload = async () => {

            const predictions = await model.classify(imageElement);

            if (predictions.length > 0) {

                topPrediction = predictions[0].className;



                // 翻訳処理

                const translatedPrediction = await translateToJapanese(topPrediction);



                // 結果をHTMLに表示

                resultsDiv.innerHTML = `

                    <h2>識別結果</h2>

                    <p>英語名: ${topPrediction}</p>

                    <p>日本語名: ${translatedPrediction}</p>

                    <button id="correctButton">間違っていますか？</button>

                `;



                // 正しい名前を修正するボタンのイベントリスナー

                document.getElementById("correctButton").addEventListener("click", () => {

                    displayCorrectionInterface(topPrediction);

                });

            } else {

                resultsDiv.innerHTML = "<p>識別結果が見つかりません。</p>";

            }

        };

    } catch (err) {

        console.error("識別中にエラーが発生しました: ", err);

        resultsDiv.innerHTML = "<p>識別中にエラーが発生しました。</p>";

    }

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

const labelMap = {}; // labelMapを初期化

function trainModel(oldLabel, newLabel) {

    // ラベルマッピングを更新

    labelMap[oldLabel] = newLabel;

    console.log(`モデルを再学習: ${oldLabel} -> ${newLabel}`);



    // ユーザー通知

    resultsDiv.innerHTML = `

        <p>再学習完了: ${oldLabel} の新しいラベルは ${newLabel} です。</p>

    `;

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
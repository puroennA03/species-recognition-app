const camera = document.getElementById("camera");



const snapshotCanvas = document.getElementById("snapshotCanvas");



const uploadInput = document.getElementById("uploadInput");



const captureButton = document.getElementById("captureButton");



const uploadButton = document.getElementById("uploadButton");



const identifyButton = document.getElementById("identifyButton");



const resultsDiv = document.getElementById("results");



let selectedImage = null;



// アップロードボタンを押すとファイル選択を表示

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

    const tracks = stream.getTracks();

    tracks.forEach(track => track.stop());

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



    // MobileNetでの識別処理

    const model = await mobilenet.load();

    const imageElement = new Image();

    imageElement.src = selectedImage;

    imageElement.onload = async () => {

        const predictions = await model.classify(imageElement);

        if (predictions.length > 0) {

            const topPrediction = predictions[0].className;



            // 翻訳処理（省略してもOK）

            const translatedPrediction = await translateToJapanese(topPrediction);



            // 結果をHTMLに表示

            resultsDiv.innerHTML = `

                <h2>識別結果</h2>

                <p>英語名: ${topPrediction}</p>

                <p>日本語名: ${translatedPrediction}</p>

                <p>上記の結果が間違っている場合は、正しい名称を入力してください。</p>

                <input type="text" id="customLabel" placeholder="正しい名称を入力">

                <button id="submitLabel">正しい名称を送信</button>

            `;



            // 新しいラベル送信ボタンの処理

            document.getElementById("submitLabel").addEventListener("click", () => {

                const customLabel = document.getElementById("customLabel").value;

                if (customLabel) {

                    resultsDiv.innerHTML = `<p>正しい名称: ${customLabel} が入力されました。</p>`;

                } else {

                    resultsDiv.innerHTML = "<p>正しい名称が入力されていません。</p>";

                }

            });



        } else {

            resultsDiv.innerHTML = "<p>識別結果が見つかりません。</p>";

        }

    };

});



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

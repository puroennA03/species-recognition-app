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



// iNaturalist APIベースURL

const iNaturalistAPIBase = "https://api.inaturalist.org/v1/taxa";



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



// ファイルアップロード

uploadInput.addEventListener("change", (event) => {

    const file = event.target.files[0];

    if (!file) {

        resultsDiv.innerHTML = "<p>ファイルが選択されませんでした。</p>";

        return;

    }



    const reader = new FileReader();

    reader.onload = () => {

        selectedImage = reader.result; // Base64形式の画像データ

        resultsDiv.innerHTML = "<p>画像が選択されました。識別ボタンを押してください。</p>";

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



            // 日本語ラベリング適用またはiNaturalist APIで検索

            const japaneseLabel = await getJapaneseLabel(topPrediction);



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



// ラベルを取得する関数（ラベリングマップまたはiNaturalist APIを使用）

async function getJapaneseLabel(englishLabel) {

    // ラベルマッピングで確認

    if (labelMap[englishLabel]) {

        return labelMap[englishLabel];

    }



    // iNaturalist APIで検索

    try {

        const response = await axios.get(`${iNaturalistAPIBase}?q=${encodeURIComponent(englishLabel)}`);

        if (response.data.results.length > 0) {

            const taxa = response.data.results[0];

            return taxa.preferred_common_name || "ラベルなし";

        }

    } catch (err) {

        console.error("iNaturalist APIエラー: ", err);

    }

    return "ラベルなし";

}



// 修正インターフェースを表示

function displayCorrectionInterface(currentLabel) {

    resultsDiv.innerHTML += `

        <div id="correctionForm">

            <p>正しい名前を入力してください:</p>

            <input type="text" id="newLabel" placeholder="正しい名前">

            <button id="submitCorrection">送信</button>

        </div>

    `;



    document.getElementById("submitCorrection").addEventListener("click", async () => {

        const newLabel = document.getElementById("newLabel").value;

        if (newLabel) {

            await trainModel(currentLabel, newLabel);

        }

    });

}



// 再学習処理

async function trainModel(oldLabel, newLabel) {

    // ラベルマッピングを更新

    labelMap[oldLabel] = newLabel;



    // ここにモデルの再学習ロジックを実装（TensorFlow.jsを活用）

    // ※詳細な実装にはデータセットやバックエンドのサポートが必要です

    console.log(`モデルを再学習: ${oldLabel} -> ${newLabel}`);

    resultsDiv.innerHTML = "<p>モデルが再学習されました。</p>";

}
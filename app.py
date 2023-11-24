from flask import Flask, render_template, request,jsonify
from pdfminer.high_level import extract_text
from werkzeug.utils import secure_filename
import re,os
from beyza import PdfParser, DataProcessor
import webview

app = Flask(__name__,template_folder="./templates")

def al(text):
    lines_pattern = r"(\d+\s+[A-Z]\s+:.+?(?=\d+\s+[A-Z]\s+:|\DÜZENLEYEN|\Z))"
    correct_lines = re.findall(lines_pattern, text, re.DOTALL)
    cleaned_lines = [line.strip() for line in correct_lines]
    return cleaned_lines

@app.route('/')
def index():
    return render_template('upload.html')

@app.route('/show_table', methods=['POST'])
def show_table():   
    pdf_file = request.files['pdf']
    filename = secure_filename(pdf_file.filename)
    # print("+"*150)
    # print("dosya geldi")
    if not os.path.exists('temp_directory'):
        os.makedirs('temp_directory')
    pdf_file_path = os.path.join('temp_directory/', filename)  # 'temp_directory/' klasörü önceden oluşturulmalıdır.
    pdf_file.save(pdf_file_path)
    parser = PdfParser()
    text_pdfminer_one = extract_text(pdf_file_path)
    
    sorguZamani=re.split("\n\nTÜRKİYE CUMHURİYETİ", text_pdfminer_one)[0]
    text_pdfminer = re.sub(r'\n\n\d+/\d+\n\n', '', text_pdfminer_one)
    text = text_pdfminer.replace("\n", " ").replace("   "," ").replace("  "," ").replace(" YUKARIDA KİMLİK BİLGİLERİ BULUNAN KİŞİNİN ADLİ SİCİL ARŞİV KAYDI VARDIR.", "").replace(sorguZamani,"").replace("\x0c", "")
    veriler = al(text)
    hepsi = []
    yasakli_kelimeler = ["ÇOCUK SUÇU ERT", "STGB", "KOŞULLU", "AYNEN İNFAZ","ORTADAN KALDIRMA", "İNFAZIN DURDURULMASI", "KARAR DEĞİŞİKLİĞİ", "DÜŞME"] # "TECİLLİ",
    yasakli_siciller =[] #sayfada daha burayı göstermiyoruz
    for metin in veriler:
        if any(yasakli_kelime in metin for yasakli_kelime in yasakli_kelimeler):
            yasakli_siciller.append(metin)
            continue
        elif "HÜKMÜN" in metin and "ÇOCUK SUÇU" in metin:
            hukmun_cocuk_data = parser.parse_hukmun_data(metin)
            hepsi.append(hukmun_cocuk_data)
        elif "HÜKMÜN" in metin and "DENETİM" in metin: 
            hukmun_denetim_data = parser.parse_hukmun_data(metin)
            hepsi.append(hukmun_denetim_data)
        elif "İCM" in metin and all(word not in metin for word in ["DENETİM", "HÜKMÜN", "ERTELEME", "KAMU"]):
            icm_data = parser.parse_icm_data(metin)
            hepsi.append(icm_data)
        elif "KAMU" in metin and all(word not in metin for word in ["DENETİM", "HÜKMÜN", "ERTELEME", "İCM"]):
            dae_data = parser.parse_dae_data(metin)
            hepsi.append(dae_data)
        elif "HÜKMÜN" in metin and all(word not in metin for word in ["KAMU", "ERTELEME", "DENETİM", "İCM"]):
            hukmun_data = parser.parse_hukmun_data(metin)
            hepsi.append(hukmun_data)
        elif "ERTELEME" in metin and all(word not in metin for word in ["KAMU", "HÜKMÜN", "DENETİM", "İCM"]):
            erteleme_data = parser.parse_erteleme_data(metin)
            hepsi.append(erteleme_data)
        elif "DENETİM" in metin and all(word not in metin for word in ["KAMU", "HÜKMÜN", "ERTELEME", "İCM"]):
            denet_data = parser.parse_denet_data(metin)
            hepsi.append(denet_data)
        else:
            genel_data = parser.parse_genel_data(metin)
            hepsi.append(genel_data)
    basari =[len(veriler), len(hepsi),len(yasakli_siciller)]
    # print("dosya gönderildi")
    # print(yasakli_siciller)
    # print("-"*150)
    return jsonify({"sonuc": hepsi, "filename": pdf_file.filename, "yasakli":yasakli_siciller, "basari":basari}) #render_template('table.html', sonuc=sonuc,filename=pdf_filename)

@app.route("/update-table", methods=["POST"])
def update_table():
    data1 = request.json
    data = data1.get('data')
    reference_date = data1.get('reference_date')
    # print("+-+-"*50)
    # print(data)
    # print("+-+-"*50)
    if data:
        # key_mapping = { 'Sıra':'sira',    'Kod': 'kod',    'Suç Tarihi': 'suctarihi',    'Hüküm': 'hukum',    'Mahkeme': 'mahkeme',    'Karar': 'karar',    'K Tarihi': 'ktarihi',    'E Sayısı': 'esayisi',    'K Sayısı': 'ksayisi',    'Kesinleşme': 'kesinlesme'}
        # hepsi = [{key_mapping[key]: value for key, value in entry.items()} for entry in data]
        processor = DataProcessor(data, reference_date = reference_date )  #= '15/09/2019'
        results = processor.sonuc.to_dict('records')
        # print(results)   
    return jsonify({"results":results})

webview.create_window("Uygulama",app)

if __name__ == '__main__':
    # app.run()
    # app.run(debug=True)
    webview.start()
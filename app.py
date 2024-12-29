from flask import Flask, send_from_directory, abort
import os

app = Flask(__name__, static_folder='public')

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/audio/<path:filename>')
def serve_audio(filename):
    try:
        return send_from_directory(os.path.join(app.static_folder, 'audio'), filename)
    except:
        abort(404)

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False) 
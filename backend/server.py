from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
import uuid
from werkzeug.utils import secure_filename
from datetime import datetime

app = Flask(__name__)
# Enable CORS for the React frontend running on localhost:5173
CORS(app)

# Configuration for paths
BASE_DIR = os.path.dirname(os.path.abspath(__name__))
DATA_DIR = os.path.join(BASE_DIR, 'backend', 'data')
UPLOAD_FOLDER = os.path.join(DATA_DIR, 'uploads')
PROJECTS_FILE = os.path.join(DATA_DIR, 'projects.json')
MESSAGES_FILE = os.path.join(DATA_DIR, 'messages.json')

# Constants
MAX_CONTENT_LENGTH = 5 * 1024 * 1024 # 5MB max-limit
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure directories and files exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

for file in [PROJECTS_FILE, MESSAGES_FILE]:
    if not os.path.exists(file):
        with open(file, 'w') as f:
            json.dump([], f)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_json(filepath):
    try:
        with open(filepath, 'r') as f:
            return json.load(f)
    except:
        return []

def write_json(filepath, data):
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=4)

# -----------------------------------------
# Messages APIs
# -----------------------------------------

@app.route('/api/messages', methods=['GET'])
def get_messages():
    messages = read_json(MESSAGES_FILE)
    # Sort messages by createdAt descending
    messages.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
    return jsonify(messages), 200

@app.route('/api/messages', methods=['POST'])
def add_message():
    data = request.json
    if not data or not data.get('name') or not data.get('email') or not data.get('message'):
        return jsonify({"error": "Missing fields"}), 400
    
    new_message = {
        "id": str(uuid.uuid4()),
        "name": data.get('name'),
        "email": data.get('email'),
        "message": data.get('message'),
        "createdAt": datetime.utcnow().isoformat() + "Z"
    }

    messages = read_json(MESSAGES_FILE)
    messages.append(new_message)
    write_json(MESSAGES_FILE, messages)

    return jsonify({"success": True, "message": "Message saved successfully", "data": new_message}), 201

# -----------------------------------------
# Projects APIs
# -----------------------------------------

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = read_json(PROJECTS_FILE)
    return jsonify(projects), 200

@app.route('/api/projects', methods=['POST'])
def add_project():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(f"{int(datetime.utcnow().timestamp())}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # generate the local URL
        base_url = request.host_url.rstrip('/')
        iconUrl = f"{base_url}/api/uploads/{filename}"
        
        new_project = {
            "id": str(uuid.uuid4()),
            "name": request.form.get('name'),
            "description": request.form.get('description'),
            "link": request.form.get('link'),
            "theme": request.form.get('theme'),
            "iconUrl": iconUrl,
            "filename": filename,  # store this for easy deletion later
            "createdAt": datetime.utcnow().isoformat() + "Z"
        }

        projects = read_json(PROJECTS_FILE)
        projects.append(new_project)
        write_json(PROJECTS_FILE, projects)

        return jsonify({"success": True, "project": new_project}), 201

    return jsonify({"error": "Invalid file type"}), 400

@app.route('/api/projects/<project_id>', methods=['DELETE'])
def delete_project(project_id):
    projects = read_json(PROJECTS_FILE)
    project_to_delete = next((p for p in projects if p.get('id') == project_id), None)
    
    if not project_to_delete:
        return jsonify({"error": "Project not found"}), 404

    # remove image file if exists
    filename = project_to_delete.get('filename')
    if filename:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        if os.path.exists(file_path):
            os.remove(file_path)

    projects = [p for p in projects if p.get('id') != project_id]
    write_json(PROJECTS_FILE, projects)
    return jsonify({"success": True, "message": "Project deleted"}), 200

@app.route('/api/projects/<project_id>', methods=['PUT'])
def update_project(project_id):
    data = request.json
    projects = read_json(PROJECTS_FILE)
    
    project_found = False
    for project in projects:
        if project.get('id') == project_id:
            project_found = True
            if 'link' in data:
                project['link'] = data.get('link')
            # Add other updateable fields here if needed
            project['updatedAt'] = datetime.utcnow().isoformat() + "Z"
            break
            
    if not project_found:
        return jsonify({"error": "Project not found"}), 404

    write_json(PROJECTS_FILE, projects)
    return jsonify({"success": True, "message": "Project updated"}), 200

# -----------------------------------------
# Static File Serving (for uploads)
# -----------------------------------------

@app.route('/api/uploads/<filename>')
def serve_upload(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    app.run(debug=True, port=5000)

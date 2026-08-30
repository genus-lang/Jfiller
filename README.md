# JobFill

JobFill is an AI-powered Chrome extension designed to automate the tedious process of filling out job application forms. It leverages ChatGPT completely in the background to read your resume, extract your profile, and intelligently map your information to the varied and complex fields found on modern job application portals (Workday, Greenhouse, Lever, etc.).

## 🚀 Features

- **Upload Actual Resumes (PDF/DOCX)**: Upload your resume once. The extension securely encodes and stores it locally for all future applications.
- **Headless AI Resolution**: When you click "Auto-Resolve Unknowns with AI", the extension silently rebuilds your PDF and programmatically uploads it directly into a background ChatGPT tab. No disruptive tab switching or redirecting.
- **Persistent Overlay UI**: The extension interface opens as a sleek, non-intrusive side panel that stays with you on the application page.
- **Intelligent Field Mapping**: Extracts form fields, detects their type (text, select, radio, checkbox, date), and accurately maps your profile data to them using semantic matching.
- **Resume Auto-Injection**: JobFill bypasses strict browser security on `<input type="file">` fields using the DataTransfer API, allowing it to automatically drop your stored PDF directly into "Upload Resume" fields on job forms.

## 📦 Installation

### From Source (Developer Mode)

1. Clone this repository:
   ```bash
   git clone https://github.com/genus-lang/Jfiller.git
   cd Jfiller
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the extension:
   ```bash
   npm run package -w jobfill-extension
   ```

4. Load into Chrome:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in the top right).
   - Click **Load unpacked**.
   - Select the `apps/extension/dist` folder in this repository.

*(Alternatively, you can just drag and drop the generated `jobfill-v1.0.0.zip` into the Extensions page).*

## 💡 How to Use

1. **Setup Your Profile:**
   - Click the JobFill icon in your browser toolbar to open the side panel.
   - Go to the **Master Profile** tab and click **Upload Resume**.
   - Select your resume file. It will be saved securely.
   - Click **Extract Profile with ChatGPT** to automatically populate your work history and personal details.

2. **Auto-Fill an Application:**
   - Navigate to a job application page.
   - Open the JobFill side panel.
   - Click the **Auto-Fill Form** button.
   - JobFill will instantly map your known profile data to the form fields, including uploading your resume document.
   - For any complex or custom questions, click **Auto-Resolve Unknowns with AI**. JobFill will silently ask ChatGPT in the background and fill in the remaining answers.

## 🛠️ Tech Stack

- **React & TypeScript**
- **Vite** (Bundler)
- **Manifest V3**
- **DOM Injection & DataTransfer API**

## 🔒 Privacy

JobFill stores your profile data and resume entirely in `chrome.storage.local`. Data is only sent to ChatGPT when you explicitly use the AI extraction or resolution features. The extension does not track you or send data anywhere else.

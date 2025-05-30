// Initialize OpenAI (replace with your API key)
const openai = new OpenAI({
  apiKey: 'YOUR_OPENAI_API_KEY',  // Get from https://platform.openai.com/api-keys
  dangerouslyAllowBrowser: true   // Required for client-side usage
});

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('resumeUpload');
const roastResult = document.getElementById('roastResult');
const roastText = document.getElementById('roastText');
const copyBtn = document.getElementById('copyBtn');

// Handle drag/drop
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) {
    fileInput.files = e.dataTransfer.files;
    processResume();
  }
});

// Handle file selection
fileInput.addEventListener('change', processResume);

// Extract text from PDF/DOCX
async function extractText(file) {
  if (file.type === 'application/pdf') {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(file)).promise;
    let text = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ');
    }
    return text;
  } else {
    // For DOCX/TXT, we'll just pretend it's plain text (real apps would use a lib like mammoth.js)
    return await file.text();
  }
}

// Generate the roast
async function processResume() {
  const file = fileInput.files[0];
  if (!file) return;

  try {
    const resumeText = await extractText(file);
    roastText.innerHTML = "🤖 AI is roasting your resume...";

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a brutally honest career advisor. Roast the user's resume with harsh but constructive feedback. Highlight ATS issues, vague language, and formatting problems. Keep it under 300 words. Format in HTML with <strong>bold</strong> for criticisms and <em>italics</em> for suggestions."
        },
        {
          role: "user",
          content: resumeText
        }
      ]
    });

    roastText.innerHTML = response.choices[0].message.content;
    roastResult.classList.remove('hidden');
  } catch (error) {
    roastText.innerHTML = `Error: ${error.message}`;
  }
}

// Copy roast to clipboard
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(roastText.innerText)
    .then(() => alert('Roast copied!'))
    .catch(err => console.error('Failed to copy:', err));
});

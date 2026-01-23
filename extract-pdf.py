import PyPDF2
import os
from pathlib import Path

pdf_dir = Path(r'C:\Projects\Edit-Assistant\public\PDF')
pdf_files = sorted(pdf_dir.glob('*.pdf'))

for pdf_file in pdf_files:
    print('\n' + '='*60)
    print(f'📄 ARCHIVO: {pdf_file.name}')
    print('='*60)
    
    try:
        with open(pdf_file, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            text = ''
            for page in pdf_reader.pages:
                text += page.extract_text()
            print(text)
    except Exception as e:
        print(f'Error: {e}')
    
    print('\n')

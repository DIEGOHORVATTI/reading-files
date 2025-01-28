import React, { useState } from 'react';

import { parse } from 'papaparse';

import { read, utils } from 'xlsx';

type DataRow = {
  nome: string;
  telefone: string;
  endereço: string;
  cpf: string;
  id: string;
};

const App = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      setLoading(true);

      if (fileExtension === 'csv') {
        // Leitura de arquivos CSV com PapaParse
        parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (result) => {
            setData((result.data as DataRow[]).slice(0, 10)); // Limita a 10 linhas
            setLoading(false);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Leitura de arquivos Excel com XLSX
        const reader = new FileReader();
        reader.onload = (e) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0]; // Obtém a primeira aba
          const sheet = workbook.Sheets[sheetName];
          const jsonData = utils.sheet_to_json<DataRow>(sheet); // Converte para JSON
          setData(jsonData.slice(0, 10)); // Limita a 10 linhas
          setLoading(false);
        };
        reader.readAsArrayBuffer(file);
      } else {
        alert(
          'Formato de arquivo não suportado. Envie um arquivo CSV ou Excel.'
        );
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Carregar e Exibir CSV/Excel</h1>
      <input
        type="file"
        accept=".csv, .xlsx, .xls"
        onChange={handleFileUpload}
        className="mb-4"
      />
      {loading ? (
        <p className="text-gray-500">Carregando arquivo...</p>
      ) : data.length > 0 ? (
        <table className="table-auto w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-4 py-2">Nome</th>
              <th className="border px-4 py-2">Telefone</th>
              <th className="border px-4 py-2">Endereço</th>
              <th className="border px-4 py-2">CPF</th>
              <th className="border px-4 py-2">ID</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{row.nome}</td>
                <td className="border px-4 py-2">{row.telefone}</td>
                <td className="border px-4 py-2">{row.endereço}</td>
                <td className="border px-4 py-2">{row.cpf}</td>
                <td className="border px-4 py-2">{row.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">Nenhum arquivo carregado.</p>
      )}
    </div>
  );
};

export default App;

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

  const fileUploadLoader = (
    <p className="text-gray-500 mt-4">Carregando arquivo...</p>
  );
  const dataTable = (
    <table className="table-auto w-full border-collapse border border-gray-100 mt-4 rounded-lg shadow-sm">
      <thead>
        <tr className="bg-gray-100 text-left">
          <th className="border px-4 py-2 text-sm font-semibold text-gray-700">
            Nome
          </th>
          <th className="border px-4 py-2 text-sm font-semibold text-gray-700">
            Telefone
          </th>
          <th className="border px-4 py-2 text-sm font-semibold text-gray-700">
            Endereço
          </th>
          <th className="border px-4 py-2 text-sm font-semibold text-gray-700">
            CPF
          </th>
          <th className="border px-4 py-2 text-sm font-semibold text-gray-700">
            ID
          </th>
        </tr>
      </thead>

      <tbody>
        {data.map((row, index) => (
          <tr
            key={index}
            className="hover:bg-gray-50 cursor-pointer transition-colors duration-200 ease-in-out"
          >
            <td className="border px-4 py-2 text-sm">{row.nome}</td>
            <td className="border px-4 py-2 text-sm">{row.telefone}</td>
            <td className="border px-4 py-2 text-sm">{row.endereço}</td>
            <td className="border px-4 py-2 text-sm">{row.cpf}</td>
            <td className="border px-4 py-2 text-sm">{row.id}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const noFileUploadedMessage = (
    <p className="text-gray-500 mt-4">Nenhum arquivo carregado.</p>
  );

  return (
    <div className="h-screen font-sans text-gray-500 bg-gray-200">
      <div className="flex justify-center w-full mx-auto sm:max-w-lg">
        <div className="flex flex-col items-center justify-center w-full h-auto my-20 bg-white sm:w-3/4 sm:rounded-lg sm:shadow-xl">
          <div className="mt-10 mb-10 text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Carregar seus arquivos
            </h2>
            <p className="text-xs text-gray-500">Formato: .csv ou .xlsx</p>
          </div>

          <form
            action="#"
            className="relative w-4/5 h-32 max-w-xs mb-10 bg-white bg-gray-100 rounded-lg shadow-inner"
          >
            <input
              type="file"
              id="uploadFile1"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="uploadFile1"
              className="z-20 flex flex-col-reverse items-center justify-center w-full h-full cursor-pointer"
            >
              <p className="z-10 text-xs font-light text-center text-gray-500">
                Arraste & Solte seus arquivos aqui
              </p>
              <svg
                className="z-10 w-8 h-8 text-indigo-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
              </svg>
            </label>
          </form>
        </div>
      </div>

      {loading
        ? fileUploadLoader
        : data.length > 0
        ? dataTable
        : noFileUploadedMessage}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useRef } from 'react';
import { parse } from 'papaparse';
import { read, utils } from 'xlsx';

type DataRow = {
  nome: string;
  telefone: string;
  endereço: string;
  cpf: string;
  id: string;
};

type LoadLog = {
  fileSize: number | null;
  uploadTime: number | null;
  renderTime: number | null;
  fileType: string | null;
};

const App = () => {
  const [data, setData] = useState<DataRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [loadLog, setLoadLog] = useState<LoadLog>({
    fileSize: null,
    uploadTime: null,
    renderTime: null,
    fileType: null
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const renderTimeStartRef = useRef<number | null>(null);

  const startLoadingTimer = () => {
    startTimeRef.current = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        setLoadingTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }
    }, 1000);
  };

  const stopLoadingTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setLoading(false);
  };

  const handleCSVUpload = (file: File) => {
    const fileStartTime = Date.now();
    setLoadLog((prev) => ({ ...prev, fileSize: file.size, fileType: 'CSV' }));

    parse<DataRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        setData(result.data.slice(0, 10));
        const uploadTime = Date.now() - fileStartTime;
        const renderTimeStart = Date.now();

        setLoadLog((prev) => ({
          ...prev,
          uploadTime: Math.floor(uploadTime / 1000)
        }));

        renderTimeStartRef.current = renderTimeStart;

        stopLoadingTimer();
      }
    });
  };

  const handleExcelUpload = (file: File) => {
    const fileStartTime = Date.now();
    setLoadLog((prev) => ({ ...prev, fileSize: file.size, fileType: 'Excel' }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const jsonData = utils.sheet_to_json<DataRow>(sheet);
      setData(jsonData.slice(0, 10));

      const uploadTime = Date.now() - fileStartTime;
      const renderTimeStart = Date.now();

      setLoadLog((prev) => ({
        ...prev,
        uploadTime: Math.floor(uploadTime / 1000)
      }));

      renderTimeStartRef.current = renderTimeStart;

      stopLoadingTimer();
    };
    reader.readAsArrayBuffer(file);
  };

  const handleTXTUpload = (file: File) => {
    const fileStartTime = Date.now();
    setLoadLog((prev) => ({ ...prev, fileSize: file.size, fileType: 'TXT' }));

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const lines = content.split('\n').map((line) => {
        const columns = line.split(';');
        return {
          nome: columns[0] || '',
          telefone: columns[1] || '',
          endereço: columns[2] || '',
          cpf: columns[3] || '',
          id: columns[4] || ''
        };
      });
      setData(lines.slice(0, 10));

      const uploadTime = Date.now() - fileStartTime;
      const renderTimeStart = Date.now();

      setLoadLog((prev) => ({
        ...prev,
        uploadTime: Math.floor(uploadTime / 1000)
      }));

      renderTimeStartRef.current = renderTimeStart;

      stopLoadingTimer();
    };
    reader.readAsText(file);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    setLoading(true);
    setLoadingTime(0);
    startLoadingTimer();

    switch (fileExtension) {
      case 'csv':
        handleCSVUpload(file);
        break;
      case 'xlsx':
      case 'xls':
        handleExcelUpload(file);
        break;
      case 'txt':
        handleTXTUpload(file);
        break;
      default:
        alert(
          'Formato de arquivo não suportado. Envie um arquivo CSV, Excel ou TXT.'
        );
        stopLoadingTimer();
    }
  };

  useEffect(() => {
    if (data.length > 0 && renderTimeStartRef.current) {
      const renderTime = Math.floor(
        (Date.now() - renderTimeStartRef.current) / 1000
      );
      setLoadLog((prev) => ({
        ...prev,
        renderTime: renderTime
      }));
    }
  }, [data]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fileUploadLoader = (
    <div className="mt-4">
      <h2 className="text-gray-500">Carregando arquivo...</h2>
    </div>
  );

  const dataTable = (
    <table className="table-auto w-full border-collapse border border-gray-100 mt-4 rounded-lg shadow-sm">
      <thead>
        <tr className="bg-gray-100 text-left">
          {['Nome', 'Telefone', 'Endereço', 'CPF', 'ID'].map((header) => (
            <th
              key={header}
              className="border px-4 py-2 text-sm font-semibold text-gray-700"
            >
              {header}
            </th>
          ))}
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

  const renderLogs = (
    <div className="mt-4 text-sm text-gray-600">
      <p>
        <strong>Tempo de carregamento do arquivo:</strong> {loadingTime}{' '}
        segundos
      </p>
      <p>
        <strong>Peso do arquivo:</strong>{' '}
        {loadLog.fileSize
          ? `${(loadLog.fileSize / 1024).toFixed(2)} KB`
          : 'N/A'}
      </p>
      <p>
        <strong>Tempo de upload:</strong>{' '}
        {loadLog.uploadTime ? `${loadLog.uploadTime}s` : 'N/A'}
      </p>
      <p>
        <strong>Tempo de renderização:</strong>{' '}
        {loadLog.renderTime ? `${loadLog.renderTime}s` : 'N/A'}
      </p>
      <p>
        <strong>Tipo de arquivo:</strong> {loadLog.fileType || 'N/A'}
      </p>
    </div>
  );

  return (
    <div className="h-screen font-sans text-gray-500 bg-gray-200">
      <div className="flex flex-row items-center justify-center w-full h-auto p-20 space-x-4">
        <div className="flex flex-col items-center justify-center w-full h-auto bg-white sm:w-3/4 sm:rounded-lg sm:shadow-xl">
          <div className="mt-10 mb-10 text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Carregar seus arquivos
            </h2>
            <p className="text-xs text-gray-500">
              Formato: .csv, .xlsx ou .txt
            </p>
          </div>
          <form
            action="#"
            className="relative flex flex-col items-center justify-center w-full h-64 border-dashed border-2 border-gray-200 rounded-lg cursor-pointer"
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
                xmlns=""
              >
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"></path>
              </svg>
            </label>
          </form>
        </div>

        <div className="flex flex-col items-center justify-center w-full h-auto my-20 bg-white sm:w-3/4 sm:rounded-lg sm:shadow-xl">
          <div className="mt-10 mb-10 text-center">
            <h2 className="text-1xl font-semibold mb-2">
              Tempo de carregamento
            </h2>
            <p className="text-xs text-gray-500">{renderLogs}</p>
          </div>
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

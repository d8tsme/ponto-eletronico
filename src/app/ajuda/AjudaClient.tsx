"use client";

import Link from "next/link";

export function AjudaClient() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Central de Ajuda</h1>
              <p className="mt-1 text-sm text-slate-600">
                Aprenda como usar o sistema de ponto eletrônico com reconhecimento facial
              </p>
            </div>
            <Link
              href="/login"
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 transition"
            >
              Voltar ao Login
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Tutorial */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">📚 Tutorial: Como Bater Ponto</h2>

          {/* Passo 1 */}
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Acessar o Sistema</h3>
                <p className="mt-2 text-sm text-slate-600">
                  1. Abra o aplicativo no seu dispositivo móvel ou navegador
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  2. Insira seu e-mail e senha cadastrados
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  3. Clique em <span className="font-medium">"Entrar"</span>
                </p>
              </div>
            </div>
          </div>

          {/* Passo 2 */}
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Registrar Foto Mestra (Primeiro Acesso)</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Na primeira vez, você precisará cadastrar sua foto para reconhecimento facial:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  <li>Posicione seu rosto centralizado na câmera</li>
                  <li>Garanta boa iluminação do ambiente</li>
                  <li>Clique em <span className="font-medium">"Salvar foto mestra e continuar"</span></li>
                  <li>Aguarde o processamento (normalmente 2-5 segundos)</li>
                </ul>
                <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-700 font-medium">
                  ⚠️ Dica: Use boa iluminação e fique bem de frente para a câmera
                </p>
              </div>
            </div>
          </div>

          {/* Passo 3 */}
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Bater Ponto de Entrada</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Ao chegar no trabalho:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  <li>Clique em <span className="font-medium">"Bater Ponto"</span></li>
                  <li>Permita acesso à câmera (primeira vez)</li>
                  <li>Alinhe seu rosto com a câmera</li>
                  <li>Permite acesso à localização GPS (sua localização será registrada)</li>
                  <li>Preencha os dados de inspeção do veículo (se aplicável)</li>
                  <li>Clique em <span className="font-medium">"Salvar Entrada"</span></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Passo 4 */}
          <div className="mb-8 rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Bater Ponto de Saída</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Ao sair do trabalho:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  <li>Clique em <span className="font-medium">"Bater Saída"</span></li>
                  <li>Alinhe seu rosto com a câmera novamente</li>
                  <li>Será solicitado acesso à localização (sua saída será registrada)</li>
                  <li>Preencha os dados finais de inspeção do veículo</li>
                  <li>Clique em <span className="font-medium">"Salvar Saída"</span></li>
                </ul>
                <p className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-700 font-medium">
                  ✓ Seu registro de ponto foi concluído com sucesso!
                </p>
              </div>
            </div>
          </div>

          {/* Passo 5 */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-bold">
                5
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Consultar Histórico</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Para visualizar seus registros:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-slate-600 list-disc list-inside">
                  <li>Acesse a aba ou menu <span className="font-medium">"Histórico de Ponto"</span></li>
                  <li>Visualize entradas e saídas do dia, semana ou mês</li>
                  <li>Veja a localização e foto de cada registro</li>
                  <li>Exporte relatórios em PDF ou CSV se disponível</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">❓ Perguntas Frequentes (FAQ)</h2>

          {/* FAQ 1 */}
          <details className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              O que fazer se a câmera não abrir?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                Se a câmera não abrir, tente:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Verificar permissões:</strong> Vá em Configurações do seu device e permita acesso à câmera para este aplicativo</li>
                <li><strong>Recarregar página:</strong> Pressione F5 ou recarregue o navegador</li>
                <li><strong>Testar outra câmera:</strong> Se usar webcam USB, verifique se está conectada</li>
                <li><strong>Fechar outros apps:</strong> Outros aplicativos podem estar usando a câmera</li>
                <li><strong>Reiniciar o device:</strong> Se o problema persistir, reinicie seu dispositivo</li>
              </ul>
              <p className="mt-3 rounded-lg bg-yellow-50 p-2 text-xs text-yellow-700">
                💡 Se o problema persistir, contate o administrador do sistema.
              </p>
            </div>
          </details>

          {/* FAQ 2 */}
          <details className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              "Rosto não detectado" - O que fazer?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                Mensagem de erro: <span className="font-mono bg-slate-100 px-2 py-1">Rosto não detectado</span>
              </p>
              <p className="font-semibold">Causas e soluções:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Iluminação inadequada:</strong> Aumente a iluminação do ambiente. Não fica de costas para a luz</li>
                <li><strong>Rosto não centralizado:</strong> Coloque seu rosto no centro da tela da câmera</li>
                <li><strong>Câmera desfocada:</strong> Limpe a lente da câmera com um pano macio</li>
                <li><strong>Óculos muito escuros:</strong> Remova óculos de sol ou muito escuro</li>
                <li><strong>Distância:</strong> Mantenha o rosto a 30-60 cm de distância da câmera</li>
              </ul>
            </div>
          </details>

          {/* FAQ 3 */}
          <details className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              Como funciona o reconhecimento facial?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                O sistema usa IA moderna para reconhecer características únicas do seu rosto:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li><strong>Captura:</strong> Seu rosto é capturado pela câmera no momento do ponto</li>
                <li><strong>Análise:</strong> A foto é analisada para extrair características faciais</li>
                <li><strong>Comparação:</strong> As características são comparadas com sua foto mestra (registrada no primeiro acesso)</li>
                <li><strong>Resultado:</strong> Se coincidirem, o ponto é registrado. Caso contrário, é rejeitado</li>
              </ol>
              <p className="mt-3 rounded-lg bg-green-50 p-2 text-xs text-green-700">
                ✅ Seus dados biométricos são armazenados em servidor seguro e criptografado
              </p>
            </div>
          </details>

          {/* FAQ 4 */}
          <details className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              Posso criar uma nova senha ou resetar minha conta?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                Para resetar sua senha:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Na tela de login, procure por "Esqueceu a senha?" ou similar</li>
                <li>Insira seu e-mail de cadastro</li>
                <li>Verifique o e-mail de recuperação (chegará em poucos minutos)</li>
                <li>Clique no link de reset e crie uma nova senha</li>
              </ol>
              <p className="mt-3 text-xs text-slate-500">
                Se não encontrar o e-mail, verifique a pasta de spam.
              </p>
            </div>
          </details>

          {/* FAQ 5 */}
          <details className="mb-4 rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              Qual é a privacidade dos meus dados biométricos?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                <strong>Seus dados são protegidos da seguinte forma:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Armazenados em servidor seguro com criptografia SSL/TLS</li>
                <li>Acessível apenas para você e administradores de sistema</li>
                <li>Não são compartilhados com terceiros</li>
                <li>Podem ser deletados sob sua solicitação</li>
                <li>Conformidade com LGPD (Lei Geral de Proteção de Dados)</li>
              </ul>
              <p className="mt-3 text-xs text-slate-500">
                Para mais informações sobre privacidade, contate o administrador do sistema.
              </p>
            </div>
          </details>

          {/* FAQ 6 */}
          <details className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md transition">
            <summary className="flex cursor-pointer items-center gap-3 px-6 py-4 font-semibold text-slate-900 hover:bg-slate-50">
              <span>▶</span>
              Preciso permitir acesso ao GPS? Por que?
            </summary>
            <div className="border-t border-slate-200 px-6 py-4 text-sm text-slate-600 space-y-3">
              <p>
                Sim, é necessário permitir o acesso ao GPS para:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Registrar localização:</strong> Atualizar onde você bateu ponto (entrada e saída)</li>
                <li><strong>Conformidade:</strong> Garantir que o ponto foi batido no local autorizado</li>
                <li><strong>Relatório:</strong> Gerentes podem visualizar o histórico de localizações</li>
              </ul>
              <p className="mt-3 rounded-lg bg-blue-50 p-2 text-xs text-blue-700">
                ℹ️ A localização é registrada apenas quando você bate ponto, não continuamente.
              </p>
            </div>
          </details>
        </section>

        {/* Support */}
        <section className="rounded-lg border border-blue-200 bg-blue-50 p-8 text-center">
          <h3 className="text-lg font-semibold text-blue-900">Ainda tem dúvidas?</h3>
          <p className="mt-2 text-sm text-blue-700">
            Contate o administrador do sistema ou suporte técnico para obter ajuda adicional.
          </p>
          <div className="mt-6 flex flex-col gap-3 items-center justify-center">
            <Link
              href="/login"
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 transition"
            >
              Voltar ao Login
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}

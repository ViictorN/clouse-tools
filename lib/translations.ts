import { Category, Tool, CATEGORIES, TOOLS } from './data';
import { Locale } from './i18n';

export interface CategoryTranslation {
  name: string;
  desc: string;
  blurb: string;
}

export interface ToolTranslation {
  name: string;
  desc: string;
  about: string;
  kw: string;
}

export const CATEGORIES_PT: Record<string, CategoryTranslation> = {
  math: {
    name: 'Ferramentas Matemáticas',
    desc: 'Calculadoras e utilitários matemáticos para o dia a dia.',
    blurb: 'Porcentagens, médias, proporções e cálculos rápidos para a rotina. Resultados precisos, instantaneamente.',
  },
  text: {
    name: 'Ferramentas de Texto',
    desc: 'Analise, limpe e transforme texto em tempo real.',
    blurb: 'Conte, converta, limpe, ordene e compare texto com zero atrito — tudo direto no seu navegador.',
  },
  date: {
    name: 'Data & Hora',
    desc: 'Trabalhe com tempo, datas e fusos horários.',
    blurb: 'Diferença entre datas, idades, contagens regressivas, cronômetros e conversores para qualquer agendamento.',
  },
  converters: {
    name: 'Conversores de Unidades',
    desc: 'Converta medidas, grandezas e unidades.',
    blurb: 'Comprimento, massa, temperatura, dados, velocidade e energia — um motor de conversão preciso e universal.',
  },
  developer: {
    name: 'Ferramentas para Devs',
    desc: 'Codifique, formate, valide e inspecione dados.',
    blurb: 'Base64, JSON, regex, hashes, JWT e utilitários essenciais feitos para desenvolvedores modernos.',
  },
  design: {
    name: 'Design & Imagem',
    desc: 'Trabalhe com imagens, cores e vetores.',
    blurb: 'Redimensione fotos, crie gradientes, extraia paletas e gere QR codes — sem uploads, 100% no seu dispositivo.',
  },
};

export const TOOLS_PT: Record<string, ToolTranslation> = {
  /* ---------------- MATH ---------------- */
  'percentage-calculator': {
    name: 'Calculadora de Porcentagem',
    desc: 'Quanto é X% de Y — e todas as variações de porcentagem.',
    about: 'Resolva as três perguntas clássicas de porcentagem em um só lugar: quanto é X% de um valor, qual porcentagem um número representa de outro e a variação percentual entre dois números.',
    kw: 'porcentagem percentual calcular quanto e variacao desconto aumento',
  },
  'percentage-change': {
    name: 'Variação Percentual',
    desc: 'Descubra o aumento ou redução exata entre dois valores.',
    about: 'Insira o valor inicial e o novo valor para obter a porcentagem de alteração, a diferença absoluta e se houve crescimento ou queda.',
    kw: 'variacao percentual aumento reducao crescimento diferenca porcentagem',
  },
  'average-calculator': {
    name: 'Calculadora de Médias e Estatísticas',
    desc: 'Média, mediana, moda, amplitude e desvio padrão.',
    about: 'Cole qualquer lista de números e obtenha a análise estatística completa: média aritmética, mediana, moda, amplitude, variância, desvio padrão, soma e quantidade.',
    kw: 'media mediana moda estatistica desvio padrao variancia soma',
  },
  'random-number-generator': {
    name: 'Gerador de Números Aleatórios',
    desc: 'Inteiros criptograficamente seguros em qualquer intervalo.',
    about: 'Gere um ou vários números inteiros aleatórios usando a fonte criptográfica segura do navegador. Opções de valores únicos e ordenação.',
    kw: 'aleatorio sorteio dado rifa gerador numero aleatorio',
  },
  'number-base-converter': {
    name: 'Conversor de Bases Numéricas',
    desc: 'Binário, octal, decimal, hexadecimal e bases personalizadas.',
    about: 'Converta qualquer número entre a base 2 e a base 36. Resultados simultâneos e ao vivo para binário, octal, decimal e hex.',
    kw: 'binario hex decimal octal base conversor radix',
  },
  'ratio-calculator': {
    name: 'Calculadora de Proporção e Razão',
    desc: 'Simplifique razões e resolva proporções matemáticas.',
    about: 'Reduza qualquer razão à sua forma mais simples e resolva regras de três e proporções do tipo a:b = c:? em tempo real.',
    kw: 'razao proporcao simplificar escala regra de tres',
  },
  'lcm-gcd-calculator': {
    name: 'Calculadora de MMC e MDC',
    desc: 'Mínimo múltiplo comum e máximo divisor comum.',
    about: 'Encontre o MMC e o MDC de qualquer conjunto de números inteiros com a fatoração em números primos passo a passo.',
    kw: 'mmc mdc multiplo divisor fatores primos',
  },
  'rounding-calculator': {
    name: 'Arredondador de Números',
    desc: 'Arredonde números para qualquer casa decimal.',
    about: 'Arredonde para cima (ceil), para baixo (floor) ou no padrão matemático tradicional com precisão de até 12 casas decimais.',
    kw: 'arredondar decimais teto piso casas decimais',
  },
  'prime-number-checker': {
    name: 'Verificador de Números Primos',
    desc: 'Identifique primos, liste divisores e decomponha.',
    about: 'Verifique instantaneamente se um número é primo, veja todos os seus divisores e confira sua fatoração prima completa.',
    kw: 'primo numero primo divisores fatores decomposicao',
  },
  'square-root-calculator': {
    name: 'Calculadora de Raiz Quadrada',
    desc: 'Raiz quadrada, cúbica e enésima com alta precisão.',
    about: 'Calcule raízes quadradas, cúbicas e raízes de grau N de qualquer número positivo com até 12 casas decimais de precisão.',
    kw: 'raiz quadrada raiz cubica radical matematica',
  },
  'discount-calculator': {
    name: 'Calculadora de Desconto',
    desc: 'Preço final após descontos simples ou acumulados.',
    about: 'Informe o valor original e o desconto para obter a economia e o valor final a pagar. Acumule múltiplos descontos se desejar.',
    kw: 'desconto promocao cupom valor final economia liquidacao',
  },
  'tip-calculator': {
    name: 'Calculadora de Gorjeta e Divisão',
    desc: 'Calcule gorjetas e divida a conta entre pessoas.',
    about: 'Calcule o valor da gorjeta, o total por pessoa e faça arredondamentos automáticos para facilitar a divisão em restaurantes e eventos.',
    kw: 'gorjeta conta divisao restaurante dividir garcom',
  },
  'bmi-calculator': {
    name: 'Calculadora de IMC',
    desc: 'Índice de massa corporal com faixa ideal da OMS.',
    about: 'Calcule seu Índice de Massa Corporal (IMC), veja a classificação oficial da OMS e confira a faixa de peso saudável para sua altura.',
    kw: 'imc peso altura saude massa corporal ideal',
  },
  'loan-calculator': {
    name: 'Simulador de Empréstimo e Financiamento',
    desc: 'Parcelas mensais, juros totais e custo efetivo.',
    about: 'Estime a parcela mensal de empréstimos e financiamentos pela tabela de amortização padrão, com total de juros acumulados e custo final.',
    kw: 'emprestimo financiamento parcelas juros amortizacao simulador',
  },

  /* ---------------- TEXT ---------------- */
  'word-counter': {
    name: 'Contador de Palavras e Caracteres',
    desc: 'Palavras, caracteres, frases e tempo de leitura em tempo real.',
    about: 'Contador dinâmico atualizado enquanto você digita: palavras, caracteres (com e sem espaços), frases, parágrafos e estimativa de tempo de leitura e fala.',
    kw: 'contador de palavras caracteres letras frases texto digitacao',
  },
  'case-converter': {
    name: 'Conversor de Maiúsculas e Minúsculas',
    desc: 'MAIÚSCULAS, minúsculas, Título, camelCase, snake_case e mais.',
    about: 'Transforme textos em dez formatos de caixa: maiúsculas, minúsculas, Iniciais Maiúsculas, Formato de Frase, camelCase, PascalCase, snake_case, kebab-case e mais.',
    kw: 'maiusculas minusculas capitalizar camel snake kebab case texto',
  },
  'text-reverser': {
    name: 'Inversor de Texto',
    desc: 'Inverta caracteres, palavras ou linhas inteiras.',
    about: 'Espelhe um texto de trás para frente caractere por caractere, inverta a ordem das palavras ou mude a sequência das linhas.',
    kw: 'inverter espelhar reverso texto ao contrario',
  },
  'slug-generator': {
    name: 'Gerador de Slugs para URLs',
    desc: 'Crie slugs amigáveis para SEO e links sem acentos.',
    about: 'Transforme títulos em links limpos, minúsculos e sem caracteres especiais — o mesmo padrão de normalização de CMSs modernos.',
    kw: 'slug url link amigavel seo hifen normalizar',
  },
  'lorem-ipsum-generator': {
    name: 'Gerador de Lorem Ipsum',
    desc: 'Texto de preenchimento para layouts e protótipos.',
    about: 'Gere parágrafos, frases ou listas de palavras do clássico texto de marcação Lorem Ipsum na quantidade exata que seu design precisa.',
    kw: 'lorem ipsum placeholder texto ficticio preenchimento mockup',
  },
  'duplicate-line-remover': {
    name: 'Removedor de Linhas Duplicadas e Vazias',
    desc: 'Limpe listas e planilhas em apenas um clique.',
    about: 'Remova linhas duplicadas, elimine linhas em branco e apare espaços em excesso de qualquer lista, com opção de diferenciar maiúsculas.',
    kw: 'duplicadas remover linhas unicas limpar lista desduplicar',
  },
  'text-sorter': {
    name: 'Organizador e Ordenador de Linhas',
    desc: 'Ordene listas de A–Z, por tamanho ou embaralhe.',
    about: 'Organize listas em ordem alfabética, inversa, por comprimento de linha, ordem numérica ou embaralhamento aleatório, com métricas ao vivo.',
    kw: 'ordenar alfabeticamente ordenar lista az tamanho embaralhar',
  },
  'find-and-replace': {
    name: 'Localizar e Substituir',
    desc: 'Substituição em massa com texto exato ou Regex.',
    about: 'Substitua termos em documentos inteiros em uma única passagem, com suporte a expressões regulares (Regex) e contagem de ocorrências.',
    kw: 'localizar substituir buscar regex trocar texto',
  },
  'readability-analyzer': {
    name: 'Analisador de Legibilidade',
    desc: 'Facilidade de leitura Flesch, nível escolar e palavras-chave.',
    about: 'Avalie seu texto com a métrica Flesch, estime o grau de escolaridade necessário para compreensão e descubra os termos mais recorrentes.',
    kw: 'legibilidade flesch facilidade leitura palavras-chave analise',
  },
  'text-diff-checker': {
    name: 'Comparador de Textos (Diff)',
    desc: 'Compare duas versões de um texto linha a linha.',
    about: 'Cole duas versões de um conteúdo e veja com clareza todas as adições, exclusões e trechos idênticos destacados lado a lado.',
    kw: 'diff comparar diferenca mudancas texto codigo mesclar',
  },
  'accent-remover': {
    name: 'Removedor de Acentos',
    desc: 'Elimine acentos e caracteres especiais.',
    about: 'Converta caracteres acentuados para seus equivalentes ASCII simples — essencial para bases de dados, e-mails, código e URLs.',
    kw: 'acentos remover acentuacao normalizar ascii caracteres',
  },

  /* ---------------- DATE & TIME ---------------- */
  'date-difference': {
    name: 'Calculadora de Diferença Entre Datas',
    desc: 'Dias, semanas, meses e anos entre duas datas.',
    about: 'Selecione duas datas e descubra o intervalo exato em dias corridos, dias úteis, semanas, meses e anos com detalhamento completo.',
    kw: 'diferenca datas dias entre calcular periodo duracao',
  },
  'age-calculator': {
    name: 'Calculadora de Idade Exata',
    desc: 'Idade precisa em anos, meses e dias.',
    about: 'Informe sua data de nascimento para obter a idade exata até o dia de hoje, a contagem regressiva para o próximo aniversário e o dia da semana.',
    kw: 'idade aniversario nascimento quantos anos calcular idade',
  },
  'add-subtract-days': {
    name: 'Adicionar ou Subtrair Dias',
    desc: 'Calcule a data futura ou passada a partir de um intervalo.',
    about: 'Some ou subtraia dias, semanas, meses ou anos de qualquer data e descubra instantaneamente o dia final e o dia da semana resultante.',
    kw: 'somar dias subtrair calcular data prazo vencimento',
  },
  'week-number-calculator': {
    name: 'Calculadora de Número da Semana',
    desc: 'Número da semana no padrão ISO 8601.',
    about: 'Descubra o número da semana ISO de qualquer data, as datas de início (segunda) e término (domingo), o trimestre e o dia do ano.',
    kw: 'semana numero da semana calendario iso semana do ano',
  },
  'countdown-timer': {
    name: 'Contagem Regressiva Online',
    desc: 'Contador regressivo para qualquer evento ou prazo.',
    about: 'Defina uma data e hora alvo e acompanhe uma contagem em tempo real em dias, horas, minutos e segundos com precisão atômica.',
    kw: 'contagem regressiva timer prazo data limite evento dias para',
  },
  'stopwatch': {
    name: 'Cronômetro Online com Voltas',
    desc: 'Tempo decorrido com gravação de parciais e voltas.',
    about: 'Cronômetro de alta precisão no navegador com centésimos de segundo, registro de voltas (laps), pausa e reinício imediato.',
    kw: 'cronometro voltas tempo parcial marcar tempo cronometrar',
  },
  'timestamp-converter': {
    name: 'Conversor de Timestamp Unix',
    desc: 'Converta Epoch Unix em segundos/ms para datas legíveis.',
    about: 'Transforme números de timestamp Unix em datas locais e UTC formatadas — e converta datas normais para timestamp com 1 clique.',
    kw: 'unix timestamp epoch segundos converter data hora',
  },
  'timezone-converter': {
    name: 'Conversor de Fuso Horário',
    desc: 'Compare horários entre cidades do mundo.',
    about: 'Converta horários entre fusos horários internacionais com respeito ao horário de verão e dados oficiais da base IANA do seu navegador.',
    kw: 'fuso horario cidades converter hora mundial utc gmt',
  },
  'days-until': {
    name: 'Dias Até / Dias Desde',
    desc: 'Quanto tempo falta para uma data ou quanto tempo se passou.',
    about: 'Digite qualquer data para saber exatamente quantos dias faltam para o evento ou quantos dias já se passaram desde que ocorreu.',
    kw: 'quantos dias faltam dias desde contagem regressiva decorrido',
  },
  'current-time': {
    name: 'Que Horas São Agora',
    desc: 'Hora local precisa, fuso horário e horário UTC.',
    about: 'Relógio em tempo real com precisão de milissegundos, identificador oficial do fuso horário, deslocamento UTC e formato ISO.',
    kw: 'que horas sao hora atual relogio hoje fuso horario local',
  },

  /* ---------------- CONVERTERS ---------------- */
  'unit-converter': {
    name: 'Conversor Universal de Unidades',
    desc: 'Todas as famílias de grandezas em um só conversor.',
    about: 'Comprimento, massa, temperatura, área, volume, velocidade, armazenamento de dados, tempo e energia — motor único para 9 categorias.',
    kw: 'conversor unidades universal medidas grandezas converter tudo',
  },
  'length-converter': {
    name: 'Conversor de Comprimento e Distância',
    desc: 'Metros, quilômetros, milhas, pés, polegadas e mais.',
    about: 'Converta entre 12 unidades de distância, desde milímetros até milhas náuticas, com precisão imediata e fórmulas exibidas.',
    kw: 'comprimento distancia metros km milhas pes polegadas centimetros',
  },
  'weight-converter': {
    name: 'Conversor de Peso e Massa',
    desc: 'Quilos, gramas, libras, onças e toneladas.',
    about: 'Converta massa e peso entre quilogramas, gramas, libras (lb), onças (oz), pedras (st) e toneladas métricas e imperiais.',
    kw: 'peso massa quilos kg libras gramas toneladas oncas',
  },
  'temperature-converter': {
    name: 'Conversor de Temperatura',
    desc: 'Celsius, Fahrenheit e Kelvin.',
    about: 'Converta temperaturas entre as três principais escalas com as fórmulas matemáticas exatas explicadas ao lado do resultado.',
    kw: 'temperatura celsius fahrenheit kelvin graus converter',
  },
  'area-converter': {
    name: 'Conversor de Área e Superfície',
    desc: 'Metros quadrados, hectares, alqueires, acres e pés².',
    about: 'Converta medidas de superfície entre metros quadrados, hectares, quilômetros quadrados, acres e pés quadrados.',
    kw: 'area metros quadrados hectares alqueires acres superficie',
  },
  'volume-converter': {
    name: 'Conversor de Volume e Capacidade',
    desc: 'Litros, mililitros, galões, xícaras e metros cúbicos.',
    about: 'Converta capacidade entre litros, mililitros, galões americanos, quartos, xícaras de culinária e unidades cúbicas.',
    kw: 'volume litros galoes xicaras ml capacidade metros cubicos',
  },
  'speed-converter': {
    name: 'Conversor de Velocidade',
    desc: 'km/h, mph, m/s e nós náuticos.',
    about: 'Converta velocidades entre quilômetros por hora, milhas por hora, metros por segundo, pés por segundo e nós de navegação.',
    kw: 'velocidade kmh mph nos velocidade do vento m/s',
  },
  'data-storage-converter': {
    name: 'Conversor de Armazenamento de Dados',
    desc: 'Bytes, KB, MB, GB, TB em escala binária (1024).',
    about: 'Converta unidades de armazenamento digital desde bits até terabytes usando a base binária padrão dos sistemas operacionais.',
    kw: 'armazenamento bytes kb mb gb tb bits converter dados',
  },
  'time-units-converter': {
    name: 'Conversor de Unidades de Tempo',
    desc: 'De milissegundos até séculos e semanas.',
    about: 'Converta medidas de tempo entre milissegundos, segundos, minutos, horas, dias, semanas, meses comerciais e anos.',
    kw: 'tempo unidades segundos minutos horas dias converter',
  },
  'energy-converter': {
    name: 'Conversor de Energia',
    desc: 'Joules, calorias, quilowatt-hora e BTU.',
    about: 'Converta energia entre joules, calorias alimentares, quilocalorias, watt-hora, kWh e unidades térmicas britânicas (BTU).',
    kw: 'energia joules calorias kwh btu potencia trabalho',
  },
  'angle-converter': {
    name: 'Conversor de Ângulos',
    desc: 'Graus, radianos, grados e voltas completas.',
    about: 'Converta medidas angulares entre graus sexagesimais, radianos, grados e voltas — útil para matemática, física e modelagem 3D.',
    kw: 'angulos graus radianos trigonometria grados converter',
  },

  /* ---------------- DEVELOPER ---------------- */
  'base64-encoder': {
    name: 'Codificador e Decodificador Base64',
    desc: 'Base64 compatível com Unicode em ambos os sentidos.',
    about: 'Codifique ou decodifique sequências Base64 com suporte total a caracteres acentuados UTF-8, quebras de linha e saída URL-safe.',
    kw: 'base64 codificar decodificar b64 utf8 converter texto',
  },
  'json-formatter': {
    name: 'Formatador e Validador JSON',
    desc: 'Embeleze, valide a sintaxe e minifique JSON.',
    about: 'Cole qualquer JSON para organizá-lo com recuo configurável, localize posições de erros de sintaxe e minifique para produção.',
    kw: 'json formatar validar minificar embelezar json pretty',
  },
  'url-encoder': {
    name: 'Codificador e Decodificador de URL',
    desc: 'encodeURIComponent e decodeURIComponent seguro.',
    about: 'Codifique textos para uso em parâmetros e query strings de URLs com segurança, ou decodifique caracteres percentuais para texto legível.',
    kw: 'url encode decode codificar decodificar uri percent',
  },
  'html-entity-encoder': {
    name: 'Codificador de Entidades HTML',
    desc: 'Escape e desfaça escape de caracteres especiais HTML.',
    about: 'Converta caracteres como <, > e & em entidades HTML seguras para proteger suas páginas contra injeção e vulnerabilidades XSS.',
    kw: 'html entidades escape xss caracteres especiais sanitize',
  },
  'regex-tester': {
    name: 'Testador de Expressões Regulares (Regex)',
    desc: 'Teste padrões com captura de grupos e flags ao vivo.',
    about: 'Valide expressões regulares em tempo real contra textos de teste com destaque visual de correspondências, grupos e mensagens de erro.',
    kw: 'regex expressao regular testar padrao correspondencia match',
  },
  'hash-generator': {
    name: 'Gerador de Hash SHA-256',
    desc: 'Gere hashes criptográficos SHA-256 no navegador.',
    about: 'Calcule a impressão digital hash SHA-256 de qualquer texto diretamente no seu navegador, sem enviar nenhuma informação para servidores.',
    kw: 'hash sha256 sha-256 checksum integridade criptografia',
  },
  'uuid-generator': {
    name: 'Gerador de UUID v4',
    desc: 'Gere identificadores únicos universais em lote.',
    about: 'Gere um ou vários UUIDs v4 aleatórios conforme a RFC 4122, com opções de letras maiúsculas e remoção de hífens.',
    kw: 'uuid guid identificador unico rfc4122 v4 gerar',
  },
  'password-generator': {
    name: 'Gerador de Senhas Seguras',
    desc: 'Senhas fortes com medidor de entropia criptográfica.',
    about: 'Crie senhas de alta segurança com comprimento ajustável, conjuntos de caracteres personalizáveis e estimativa de bits de entropia em tempo real.',
    kw: 'senha gerador senhas fortes seguras entropia criptografia',
  },
  'markdown-previewer': {
    name: 'Visualizador de Markdown em Tempo Real',
    desc: 'Escreva Markdown e veja o HTML renderizado na hora.',
    about: 'Editor leve de Markdown com visualização instantânea: títulos, ênfases, blocos de código, listas, citações e links.',
    kw: 'markdown editor preview html readme formatar',
  },
  'css-minifier': {
    name: 'Minificador de CSS',
    desc: 'Reduza o tamanho das suas folhas de estilo no navegador.',
    about: 'Remova comentários, espaços e quebras desnecessárias do seu código CSS com comparação de tamanho e economia percentual.',
    kw: 'css minificar comprimir otimizar estilos stylesheet',
  },
  'jwt-decoder': {
    name: 'Decodificador de Tokens JWT',
    desc: 'Inspecione cabeçalhos e payloads de JWTs com privacidade.',
    about: 'Cole um token JSON Web Token para visualizar seu header e payload formatados como JSON — apenas decodificação local, sem envio a redes.',
    kw: 'jwt token decodificar json web token inspecionar auth',
  },
  'csv-to-json': {
    name: 'Conversor de CSV para JSON',
    desc: 'Transforme linhas de planilhas em objetos JSON.',
    about: 'Converta arquivos ou textos CSV em arrays de objetos JSON com suporte a campos entre aspas, delimitadores personalizados e cabeçalhos.',
    kw: 'csv json converter planilha tabela dados exportar',
  },

  /* ---------------- DESIGN ---------------- */
  'image-resizer': {
    name: 'Redimensionador de Imagens',
    desc: 'Altere dimensões de fotos diretamente no navegador.',
    about: 'Faça upload de uma imagem, defina nova largura ou altura com bloqueio de proporção, escolha o formato e baixe — nada sai do seu dispositivo.',
    kw: 'imagem redimensionar escala pixels proporcao foto',
  },
  'image-compressor': {
    name: 'Compressor de Imagens',
    desc: 'Reduza o peso de imagens mantendo a qualidade visual.',
    about: 'Comprima imagens JPG, PNG ou WebP com controle deslizante de qualidade, comparação visual do tamanho e download instantâneo.',
    kw: 'imagem comprimir reduzir tamanho otimizar fotos jpg png',
  },
  'color-converter': {
    name: 'Conversor Universal de Cores',
    desc: 'HEX, RGB, HSL e HWB simultaneamente.',
    about: 'Cole uma cor em qualquer formato para obter todos os outros formatos automaticamente, com amostra visual e cópia em 1 clique.',
    kw: 'cor converter hex rgb hsl picker paleta seletor',
  },
  'gradient-generator': {
    name: 'Gerador de Gradientes CSS',
    desc: 'Crie gradientes lineares e radiais e copie o CSS.',
    about: 'Monte gradientes com múltiplas cores, controle de ângulo em tempo real e copie o código CSS otimizado para produção.',
    kw: 'gradiente css linear radial degradê fundo background',
  },
  'shadow-generator': {
    name: 'Gerador de Sombras CSS (Box-Shadow)',
    desc: 'Ajuste sombras modernas com preview e código pronto.',
    about: 'Configure deslocamento, desfoque, propagação, cor e sombra interna (inset) com visualização em tempo real e CSS pronto para copiar.',
    kw: 'sombra box-shadow css gerador blur elevacao design',
  },
  'qr-code-generator': {
    name: 'Gerador de QR Code',
    desc: 'Transforme qualquer link ou texto em código QR.',
    about: 'Crie códigos QR nítidos para links, credenciais de Wi-Fi ou mensagens com tamanho configurável e download em imagem PNG imediato.',
    kw: 'qr code gerar qrcode link url codigo barra',
  },
  'favicon-generator': {
    name: 'Gerador de Favicon',
    desc: 'Crie ícones para sites a partir de letras ou imagens.',
    about: 'Gere favicons nos tamanhos de 16, 32, 48 e 180 px a partir de um caractere, emoji ou imagem enviada — renderizado em canvas puro.',
    kw: 'favicon icone site app icon gerar canvas',
  },
  'color-palette-extractor': {
    name: 'Extrator de Paleta de Cores',
    desc: 'Extraia as cores dominantes de qualquer fotografia.',
    about: 'Descubra as cores predominantes de qualquer imagem com algoritmo k-means executado 100% no canvas do navegador, com valores em HEX.',
    kw: 'paleta extrair cores foto dominante amostras tons',
  },
  'aspect-ratio-calculator': {
    name: 'Calculadora de Proporção de Tela (Aspect Ratio)',
    desc: 'Encontre dimensões perfeitas mantendo o aspecto.',
    about: 'Simplifique proporções, calcule larguras ou alturas proporcionais e explore razões populares como 16:9, 4:3, 1:1 e 21:9.',
    kw: 'proporcao aspect ratio 16:9 dimensoes largura altura resolucao',
  },
};

export const UI_TRANSLATIONS: Record<Locale, Record<string, string>> = {
  'en': {
    'nav.allTools': 'All Tools',
    'nav.categories': 'Categories',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.designSystem': 'Design System',
    'nav.exploreTools': 'Explore 67 Tools',
    'nav.searchPlaceholder': 'Search tools (Press ⌘K or /)',
    'nav.searchButton': 'Search 67 Tools (Ctrl+K)',
    
    'hero.eyebrow': '67 Client-Side Online Utilities',
    'hero.title': 'Everyday tools, crafted to perfection.',
    'hero.sub': 'The minimal, lightning-fast suite of 67 free utilities. Zero tracking, zero telemetry, and 100% computed in your browser.',
    'hero.searchPlaceholder': 'Search 67 tools (e.g. json, age, percentage, base64)',
    'hero.searchBtn': 'Search',
    'hero.stat1': 'Handcrafted Tools',
    'hero.stat2': 'Private & Client-Side',
    'hero.stat3': 'Data Sent to Server',
    'hero.stat4': 'Calculation Delay',
    
    'popular.eyebrow': 'Featured Collection',
    'popular.title': 'Popular Utilities',
    'popular.desc': 'The most frequently used tools, designed for quick access with keyboard ergonomics and 1-click clipboard actions.',
    'popular.viewAll': 'View all 67 tools',
    
    'shelf.title': 'Your Pinned Tools',
    'shelf.clear': 'Clear All',
    'shelf.recent': 'Recent:',
    
    'band.eyebrow': 'Architecture & Privacy',
    'band.title': 'Built for speed. Zero compromises on privacy.',
    'band.lead': 'Every transformation, calculation, hash, and format happens strictly inside your browser window. No logs, no telemetry, and no external API requests.',
    'band.chip1': 'Instant Local Execution',
    'band.chip2': 'No Cookies or Ads',
    'band.chip3': 'Sub-millisecond Compute',
    'band.chip4': '1-Click Copy with Feedback',
    'band.f1.title': 'Instant Calculation',
    'band.f1.desc': 'Calculations update as you type. No waiting for round-trips to distant cloud servers or spinners.',
    'band.f2.title': 'Absolute Confidentiality',
    'band.f2.desc': 'Your passwords, JWT tokens, customer data, and image files never leave your device. Ever.',
    'band.f3.title': 'Apple-Grade Aesthetics',
    'band.f3.desc': 'Clean typography, balanced contrast, liquid glass nav, and fluid interactions inspired by Cupertino design principles.',
    
    'cat.eyebrow': 'Categories',
    'cat.title': 'Browse by Domain',
    'cat.lead': 'Explore tools organized across mathematics, linguistics, time calculation, converters, engineering, and visual design.',
    
    'cta.eyebrow': 'Open Source & Free Forever',
    'cta.title': 'Everything you need. Nothing you don’t.',
    'cta.lead': 'Bookmark Clouse Tools for instant access whenever you need to compute, convert, or format.',
    'cta.explore': 'Explore All 67 Tools',
    'cta.github': 'Star on GitHub',
    
    'footer.brand': 'The privacy-first suite of 67 free utilities. Zero telemetry, zero accounts, and 100% computed in your browser.',
    'footer.cats': 'Categories',
    'footer.quick': 'Quick Links',
    'footer.legal': 'Legal & Project',
    'footer.allRights': 'All computations run locally on your device.',
  },
  'pt-br': {
    'nav.allTools': 'Todas as Ferramentas',
    'nav.categories': 'Categorias',
    'nav.about': 'Sobre',
    'nav.contact': 'Contato',
    'nav.designSystem': 'Design System',
    'nav.exploreTools': 'Explorar 67 Ferramentas',
    'nav.searchPlaceholder': 'Buscar ferramentas (⌘K ou /)',
    'nav.searchButton': 'Buscar 67 Ferramentas (Ctrl+K)',
    
    'hero.eyebrow': '67 Utilitários Online 100% no Navegador',
    'hero.title': 'Ferramentas do dia a dia, lapidadas com perfeição.',
    'hero.sub': 'A suíte minimalista e ultrarrápida de 67 utilitários gratuitos. Zero rastreamento, zero telemetria e 100% computado no seu dispositivo.',
    'hero.searchPlaceholder': 'Buscar 67 ferramentas (ex: json, idade, porcentagem, base64)',
    'hero.searchBtn': 'Buscar',
    'hero.stat1': 'Ferramentas Artesanais',
    'hero.stat2': 'Privado e no Navegador',
    'hero.stat3': 'Dados no Servidor',
    'hero.stat4': 'Atraso no Cálculo',
    
    'popular.eyebrow': 'Coleção em Destaque',
    'popular.title': 'Utilitários Mais Usados',
    'popular.desc': 'As ferramentas mais utilizadas, desenhadas para agilidade extrema, ergonomia de teclado e cópia em 1 clique.',
    'popular.viewAll': 'Ver todas as 67 ferramentas',
    
    'shelf.title': 'Suas Ferramentas Fixadas',
    'shelf.clear': 'Limpar Todas',
    'shelf.recent': 'Recentes:',
    
    'band.eyebrow': 'Arquitetura & Privacidade',
    'band.title': 'Feito para velocidade. Zero concessões em privacidade.',
    'band.lead': 'Cada transformação, cálculo, hash e formatação acontece estritamente na janela do seu navegador. Sem logs, sem telemetria e sem requisições a APIs externas.',
    'band.chip1': 'Execução Local Instantânea',
    'band.chip2': 'Sem Cookies ou Anúncios',
    'band.chip3': 'Computação Submilissegundo',
    'band.chip4': 'Cópia em 1 Clique com Feedback',
    'band.f1.title': 'Cálculo Instantâneo',
    'band.f1.desc': 'Os cálculos atualizam conforme você digita. Sem esperas por respostas de servidores distantes ou telas de carregamento.',
    'band.f2.title': 'Confidencialidade Absoluta',
    'band.f2.desc': 'Suas senhas, tokens JWT, dados de clientes e fotos nunca saem do seu dispositivo. Nunca.',
    'band.f3.title': 'Estética Padrão Apple',
    'band.f3.desc': 'Tipografia fluida, contraste balanceado, navegação em vidro translúcido e micro-interações refinadas com física de molas.',
    
    'cat.eyebrow': 'Categorias',
    'cat.title': 'Navegue por Domínio',
    'cat.lead': 'Explore ferramentas organizadas em matemática, linguística, cálculo de datas, conversores, desenvolvimento e design visual.',
    
    'cta.eyebrow': 'Código Aberto & Grátis para Sempre',
    'cta.title': 'Tudo o que você precisa. Nada de excessos.',
    'cta.lead': 'Salve o Clouse Tools nos seus favoritos para acesso imediato sempre que precisar calcular, converter ou formatar.',
    'cta.explore': 'Explorar Todas as 67 Ferramentas',
    'cta.github': 'Dar Estrela no GitHub',
    
    'footer.brand': 'A suíte privativa de 67 utilitários gratuitos. Zero telemetria, sem contas e 100% computado diretamente no seu navegador.',
    'footer.cats': 'Categorias',
    'footer.quick': 'Acesso Rápido',
    'footer.legal': 'Legal & Projeto',
    'footer.allRights': 'Todos os cálculos rodam localmente no seu computador.',
  },
};

export function t(key: string, locale: Locale): string {
  const dict = UI_TRANSLATIONS[locale] || UI_TRANSLATIONS['en'];
  return dict[key] || UI_TRANSLATIONS['en'][key] || key;
}

export function getLocalizedCategory(cat: Category, locale: Locale): Category {
  if (locale === 'en') return cat;
  const trans = CATEGORIES_PT[cat.id];
  if (!trans) return cat;
  return {
    ...cat,
    name: trans.name,
    desc: trans.desc,
    blurb: trans.blurb,
  };
}

export function getLocalizedCategories(locale: Locale): Category[] {
  return CATEGORIES.map((c) => getLocalizedCategory(c, locale));
}

export function getLocalizedTool(tool: Tool, locale: Locale): Tool {
  if (locale === 'en') return tool;
  const trans = TOOLS_PT[tool.slug];
  if (!trans) return tool;
  return {
    ...tool,
    name: trans.name,
    desc: trans.desc,
    about: trans.about,
    kw: `${tool.kw} ${trans.kw}`,
  };
}

export function getLocalizedTools(locale: Locale): Tool[] {
  return TOOLS.map((t) => getLocalizedTool(t, locale));
}

export function getLocalizedToolsByCategory(catId: string, locale: Locale): Tool[] {
  return getLocalizedTools(locale).filter((t) => t.cat === catId);
}

export function getLocalizedPopularTools(locale: Locale, limit: number = 8): Tool[] {
  return getLocalizedTools(locale).filter((t) => t.popular).slice(0, limit);
}

export function getLocalizedToolBySlug(slug: string, locale: Locale): Tool | undefined {
  const raw = TOOLS.find((t) => t.slug === slug);
  if (!raw) return undefined;
  return getLocalizedTool(raw, locale);
}

export function getLocalizedCategoryById(id: string, locale: Locale): Category | undefined {
  const raw = CATEGORIES.find((c) => c.id === id);
  if (!raw) return undefined;
  return getLocalizedCategory(raw, locale);
}

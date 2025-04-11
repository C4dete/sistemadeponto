document.addEventListener("DOMContentLoaded", function () {
    const tabelaPonto = document.getElementById("tabela-ponto");
    const mesSelect = document.getElementById("mes");
    const tolerancia = 10;

    function gerarTabela(mes) {
        tabelaPonto.innerHTML = "";
        const diasNoMes = new Date(2024, mes, 0).getDate();

        const cabecalho = document.createElement("tr");
        cabecalho.innerHTML = `
            <th>Dia</th>
            <th>Semana</th>
            <th>Entrada</th>
            <th>Saída</th>
            <th>Saldo</th>
            <th>Ação</th>
            <th>Descrição</th>
            <th>Atestado</th>
        `;
        tabelaPonto.appendChild(cabecalho);

        for (let dia = 1; dia <= diasNoMes; dia++) {
            const data = new Date(2024, mes - 1, dia);
            const diaSemanaIndex = data.getDay();
            const diaSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][diaSemanaIndex];

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${dia}</td>
                <td>${diaSemana}</td>
                <td><input type="time" class="entrada"></td>
                <td><input type="time" class="saida"></td>
                <td class="saldo-dia">--:--</td>
                <td><button class="hp-button">HP</button></td>
                <td><button class="desc-button">+</button></td>
                <td><input type="checkbox" class="check-atestado"></td>
            `;

            if (diaSemana === "Sáb") linha.classList.add("sabado");
            if (diaSemana === "Dom") linha.classList.add("domingo");

            tabelaPonto.appendChild(linha);

            const descLinha = document.createElement("tr");
            descLinha.classList.add("descricao-linha");
            descLinha.style.display = "none";
            descLinha.innerHTML = `
                <td colspan="100%" style="padding: 10px; background-color: #f9f9f9;" class="descricao-container">
                    <input type="text" maxlength="50" placeholder="Digite até 50 caracteres" class="desc-input" style="width: 100%; box-sizing: border-box;">
                </td>
            `;
            tabelaPonto.appendChild(descLinha);
        }

        adicionarEventos();
    }

    function adicionarEventos() {
        const linhas = tabelaPonto.querySelectorAll("tr");

        linhas.forEach((linha, index) => {
            if (index === 0) return;

            const entradaInput = linha.querySelector(".entrada");
            const saidaInput = linha.querySelector(".saida");
            const saldoCell = linha.querySelector(".saldo-dia");
            const hpBtn = linha.querySelector(".hp-button");
            const descBtn = linha.querySelector(".desc-button");
            const checkAtestado = linha.querySelector(".check-atestado");
            const descLinha = linhas[index + 1]?.classList.contains("descricao-linha") ? linhas[index + 1] : null;

            if (hpBtn) {
                hpBtn.addEventListener("click", () => {
                    entradaInput.value = "07:30";
                    saidaInput.value = "17:18";
                    calcularResumo();
                });
            }

            if (entradaInput && saidaInput) {
                entradaInput.addEventListener("input", () => {
                    calcularResumo();
                });
                saidaInput.addEventListener("input", () => {
                    calcularResumo();
                });
            }

            if (descBtn && descLinha) {
                descBtn.addEventListener("click", () => {
                    descLinha.style.display = descLinha.style.display === "none" ? "table-row" : "none";
                });
            }

            if (checkAtestado) {
                checkAtestado.addEventListener("change", () => {
                    const descInput = descLinha?.querySelector(".desc-input");
                    if (checkAtestado.checked) {
                        entradaInput.value = "";
                        saidaInput.value = "";
                        entradaInput.disabled = true;
                        saidaInput.disabled = true;
                        if (descInput) descInput.value = "Atestado";
                    } else {
                        entradaInput.disabled = false;
                        saidaInput.disabled = false;
                        if (descInput && descInput.value === "Atestado") descInput.value = "";
                    }
                    calcularResumo();
                });
            }
        });
    }

    function calcularResumo() {
        let totalCredito = 0;
        let totalDebito = 0;
        let bancoHoras = 0;

        document.querySelectorAll("#tabela-ponto tr").forEach(row => {
            const entrada = row.querySelector(".entrada")?.value;
            const saida = row.querySelector(".saida")?.value;
            const diaSemana = row.cells?.[1]?.textContent;
            const saldoDiaCell = row.querySelector(".saldo-dia");

            if (!entrada || !saida) {
                if (saldoDiaCell) saldoDiaCell.textContent = "--:--";
                return;
            }

            const [hEntrada, mEntrada] = entrada.split(":").map(Number);
            const [hSaida, mSaida] = saida.split(":").map(Number);
            const minutosEntrada = hEntrada * 60 + mEntrada;
            const minutosSaida = hSaida * 60 + mSaida;
            const minutosTrabalhados = minutosSaida - minutosEntrada;

            const jornadaPadrao = 9 * 60 + 48;
            let saldo = minutosTrabalhados - jornadaPadrao;

            if (diaSemana === "Sáb") {
                totalCredito += minutosTrabalhados * 1.5;
                bancoHoras += minutosTrabalhados * 1.5;
                if (saldoDiaCell) saldoDiaCell.textContent = formatarTempo(minutosTrabalhados * 1.5);
                return;
            }

            if (diaSemana === "Dom") {
                totalCredito += minutosTrabalhados * 2;
                bancoHoras += minutosTrabalhados * 2;
                if (saldoDiaCell) saldoDiaCell.textContent = formatarTempo(minutosTrabalhados * 2);
                return;
            }

            if (minutosEntrada >= 380 && minutosEntrada <= 519) {
                if (saldo >= tolerancia) {
                    // saldo ok
                } else if (saldo >= 1 && saldo < tolerancia) {
                    saldo = 0;
                } else if (saldo <= -tolerancia) {
                    // saldo ok
                } else if (saldo < 0 && saldo > -tolerancia) {
                    saldo = 0;
                }
            }

            if (saldo > 0) {
                totalCredito += saldo;
            } else if (saldo < 0) {
                totalDebito += Math.abs(saldo);
            }

            bancoHoras += saldo;
            if (saldoDiaCell) saldoDiaCell.textContent = formatarTempo(saldo);
        });

        const historicoElement = document.getElementById("historico-horas");
        const historicoMinutos = historicoElement
            ? parseInt(historicoElement.textContent.split(":")[0]) * 60 +
              parseInt(historicoElement.textContent.split(":")[1])
            : 0;

        const bancoFinal = bancoHoras + historicoMinutos;

        document.getElementById("total-credit").textContent = formatarTempo(totalCredito);
        document.getElementById("total-debit").textContent = formatarTempo(totalDebito);
        document.getElementById("bank-hours").textContent = formatarTempo(bancoHoras);
        document.getElementById("total-final").textContent = formatarTempo(bancoFinal);
    }

    function formatarTempo(minutos) {
        const sinal = minutos < 0 ? "-" : "";
        minutos = Math.abs(minutos);
        const horas = Math.floor(minutos / 60);
        const mins = minutos % 60;
        return `${sinal}${String(horas).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
    }

    mesSelect.addEventListener("change", () => gerarTabela(mesSelect.value));

    gerarTabela(mesSelect.value);
});

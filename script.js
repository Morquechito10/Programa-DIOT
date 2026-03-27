document.addEventListener('DOMContentLoaded', () => {
    const extraFieldsContainer = document.getElementById('extraFieldsContainer');
    const btnAdd = document.getElementById('btnAdd');
    const btnDownloadMasivo = document.getElementById('btnDownloadMasivo');
    const btnReset = document.getElementById('btnReset');
    const listaCuerpo = document.getElementById('listaCuerpo');
    const contador = document.getElementById('contador');
    const form = document.getElementById('diotForm');
    const rfcInput = document.getElementById('f2');
    const errorBox = document.getElementById('errorBox');

    let listaDIOT = [];

    for (let i = 0; i < 54; i++) {
        if (!document.getElementById(`f${i}`)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.id = `f${i}`;
            
            if (i === 53) {
                input.value = '01'; 
            } else if (i >= 7) {
                input.value = '0';  
            } else {
                input.value = '';
            }
            extraFieldsContainer.appendChild(input);
        }
    }

    rfcInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        quitarError(this);
    });

    ['f11', 'f12', 'f7', 'f8'].forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            quitarError(this);
        });
    });

    function validarFormulario() {
        let esValido = true;
        let mensajeError = "";

        const rfcVal = rfcInput.value.trim();
        const bruto16 = parseFloat(document.getElementById('f11').value) || 0;
        const dto16 = parseFloat(document.getElementById('f12').value) || 0;
        const bruto8 = parseFloat(document.getElementById('f7').value) || 0;
        const dto8 = parseFloat(document.getElementById('f8').value) || 0;

        if (rfcVal.length !== 12 && rfcVal.length !== 13) {
            marcarError(rfcInput);
            mensajeError += "• El RFC debe tener 12 o 13 caracteres alfanuméricos.<br>";
            esValido = false;
        }

        if (dto16 > bruto16) {
            marcarError(document.getElementById('f12'));
            mensajeError += "• El descuento al 16% NO puede ser mayor al Valor de Actos.<br>";
            esValido = false;
        }

        if (dto8 > bruto8) {
            marcarError(document.getElementById('f8'));
            mensajeError += "• El descuento Frontera Norte NO puede ser mayor al Valor de Actos.<br>";
            esValido = false;
        }

        if (!esValido) {
            errorBox.innerHTML = mensajeError;
            errorBox.style.display = "block";
        } else {
            errorBox.style.display = "none";
        }

        return esValido;
    }

    function marcarError(elemento) {
        elemento.classList.add('input-error');
    }

    function quitarError(elemento) {
        elemento.classList.remove('input-error');
        errorBox.style.display = "none";
    }

    btnAdd.addEventListener('click', () => {
        if (!validarFormulario()) {
            return; 
        }

        let registroFila = [];

        for (let i = 0; i < 54; i++) {
            const input = document.getElementById(`f${i}`);
            let valor = input ? input.value.trim().replace(/\|/g, "") : "";
            
            if (i === 53) {
                valor = "01"; 
            } else if (i >= 7) {
                if (valor === "") {
                    valor = "0";
                } else {
                    valor = Math.round(parseFloat(valor)).toString();
                }
            }
            
            registroFila.push(valor);
        }

        const lineaTexto = registroFila.join('|');
        
        const bruto16 = Math.round(parseFloat(document.getElementById('f11').value) || 0);
        const dto16 = Math.round(parseFloat(document.getElementById('f12').value) || 0);
        const neto16 = bruto16 - dto16;

        listaDIOT.push({
            textoFinal: lineaTexto,
            rfc: document.getElementById('f2').value,
            bruto16: bruto16,
            dto16: dto16,
            neto16: neto16
        });

        actualizarTabla();
        btnReset.click(); 
        document.getElementById('f0').focus();
    });

    btnReset.addEventListener('click', () => {
        setTimeout(() => {
            document.getElementById('f11').value = '0';
            document.getElementById('f12').value = '0';
            document.getElementById('f7').value = '0';
            document.getElementById('f8').value = '0';
            document.getElementById('f48').value = '0';
            document.getElementById('f50').value = '0';
            errorBox.style.display = "none";
            document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
        }, 10);
    });

    function actualizarTabla() {
        listaCuerpo.innerHTML = '';
        
        listaDIOT.forEach((item, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${index + 1}</td>
                <td><strong>${item.rfc}</strong></td>
                <td>$${item.bruto16}</td>
                <td style="color: #ea580c;">-$${item.dto16}</td>
                <td style="font-weight: bold; color: #16a34a;">$${item.neto16}</td>
                <td><button type="button" class="btn-delete" onclick="eliminarFila(${index})">Eliminar</button></td>
            `;
            listaCuerpo.appendChild(tr);
        });

        contador.textContent = listaDIOT.length;
        btnDownloadMasivo.disabled = listaDIOT.length === 0;
    }

    window.eliminarFila = function(index) {
        listaDIOT.splice(index, 1);
        actualizarTabla();
    };

    btnDownloadMasivo.addEventListener('click', () => {
        if (listaDIOT.length === 0) return;

        const lineas = listaDIOT.map(item => item.textoFinal);
        const contenidoTxt = lineas.join('\r\n');

        const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.download = `DIOT_CARGA_MASIVA_${listaDIOT.length}_REGISTROS.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });
});
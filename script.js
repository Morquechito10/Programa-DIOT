document.addEventListener('DOMContentLoaded', () => {
    const btnAdd = document.getElementById('btnAdd');
    const btnPreview = document.getElementById('btnPreview');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const modal = document.getElementById('satModal');
    const rfcInput = document.getElementById('f2');
    const errorBox = document.getElementById('errorBox');
    
    let listaDIOT = [];

    // MAPA EXACTO DE COLUMNAS (Ajustar según Layout oficial)
    const MAPA = {
        TIPO_TERCERO: 0, TIPO_OPERACION: 1, RFC: 2,
        BASE_16: 11, DTO_16: 12,
        BASE_8: 7, DTO_8: 8,
        BASE_0: 48, BASE_EX: 50,
        RETENIDO: 22,
        IVA_EXCLUSIVO_16: 30, IVA_PROPORCION_16: 31,
        EFECTOS_FISCALES: 53
    };

    // Auto-formato de RFC y cálculo en vivo
    rfcInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    });

    ['f11', 'f12'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            const b = parseFloat(document.getElementById('f11').value) || 0;
            const d = parseFloat(document.getElementById('f12').value) || 0;
            document.getElementById('ivaVisual').value = `$${Math.round(Math.max(0, b - d) * 0.16)}`;
        });
    });

    // ==========================================
    // LÓGICA DEL SIMULADOR SAT COMPLETO
    // ==========================================
    btnPreview.addEventListener('click', () => {
        // Leer valores formales
        const b16 = Math.round(parseFloat(document.getElementById('f11').value) || 0);
        const d16 = Math.round(parseFloat(document.getElementById('f12').value) || 0);
        const b8 = Math.round(parseFloat(document.getElementById('f7').value) || 0);
        const d8 = Math.round(parseFloat(document.getElementById('f8').value) || 0);
        const b0 = Math.round(parseFloat(document.getElementById('f48').value) || 0);
        const bEx = Math.round(parseFloat(document.getElementById('f50').value) || 0);
        const ret = Math.round(parseFloat(document.getElementById('f22').value) || 0);

        if(d16 > b16 || d8 > b8) {
            alert("Error: Los descuentos no pueden ser mayores a los valores brutos."); return;
        }

        // Cálculos Netos e Impuestos
        const n16 = b16 - d16; const iva16 = Math.round(n16 * 0.16);
        const n8 = b8 - d8;    const iva8 = Math.round(n8 * 0.08);

        // Llenar Pestaña 1 (Identificación)
        const t_tercero = document.getElementById('f0').options[document.getElementById('f0').selectedIndex].text;
        const t_operacion = document.getElementById('f1').options[document.getElementById('f1').selectedIndex].text;
        document.getElementById('sat_tipo_tercero').value = t_tercero;
        document.getElementById('sat_tipo_operacion').value = t_operacion;
        document.getElementById('sat_rfc').value = rfcInput.value || "SIN RFC";

        // Llenar Pestaña 2 (Montos)
        document.getElementById('sat_b16').value = b16.toLocaleString();
        document.getElementById('sat_d16').value = d16.toLocaleString();
        document.getElementById('sat_n16').value = n16.toLocaleString();
        document.getElementById('sat_i16').value = iva16.toLocaleString();

        document.getElementById('sat_b8').value = b8.toLocaleString();
        document.getElementById('sat_d8').value = d8.toLocaleString();
        document.getElementById('sat_n8').value = n8.toLocaleString();
        document.getElementById('sat_i8').value = iva8.toLocaleString();

        document.getElementById('sat_b0').value = b0.toLocaleString();
        document.getElementById('sat_n0').value = b0.toLocaleString();

        document.getElementById('sat_bEx').value = bEx.toLocaleString();
        document.getElementById('sat_nEx').value = bEx.toLocaleString();

        // Llenar Pestaña 3 (IVA Acreditable y Retenciones)
        const acreditamiento = document.getElementById('tipoAcreditamiento').value;
        document.getElementById('sat_iva_exclusivo').value = (acreditamiento === 'exclusivo') ? iva16.toLocaleString() : '0';
        document.getElementById('sat_iva_prop').value = (acreditamiento === 'proporcion') ? iva16.toLocaleString() : '0';
        document.getElementById('sat_iva_total').value = (acreditamiento !== 'no_acreditable') ? iva16.toLocaleString() : '0';
        
        document.getElementById('sat_retenido').value = ret.toLocaleString();

        // Mostrar Modal
        modal.style.display = 'flex';
    });

    btnCloseModal.addEventListener('click', () => { modal.style.display = 'none'; });

    // Navegación de Pestañas en el Modal
    document.querySelectorAll('.sat-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.sat-tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.sat-view').forEach(v => v.style.display = 'none');
            this.classList.add('active');
            document.getElementById(`satView${this.getAttribute('data-tab')}`).style.display = 'block';
        });
    });

    // ==========================================
    // AGREGAR Y DESCARGAR TXT
    // ==========================================
    btnAdd.addEventListener('click', () => {
        // ... (Tu lógica existente para validar y agregar al arreglo listaDIOT se mantiene igual)
        const bruto16 = Math.round(parseFloat(document.getElementById('f11').value) || 0);
        const dto16 = Math.round(parseFloat(document.getElementById('f12').value) || 0);
        const bruto8 = Math.round(parseFloat(document.getElementById('f7').value) || 0);
        const dto8 = Math.round(parseFloat(document.getElementById('f8').value) || 0);
        const ret = Math.round(parseFloat(document.getElementById('f22').value) || 0);
        
        if (dto16 > bruto16 || dto8 > bruto8 || rfcInput.value.length < 12) {
            errorBox.innerHTML = "Verifica que el RFC sea válido y que los Descuentos no superen los Brutos.";
            errorBox.style.display = "block"; return;
        }

        const neto16 = bruto16 - dto16;
        const ivaCalculado = Math.round(neto16 * 0.16);
        const acreditamiento = document.getElementById('tipoAcreditamiento').value;

        let registroTxt = new Array(54).fill("");
        registroTxt[MAPA.TIPO_TERCERO] = document.getElementById('f0').value;
        registroTxt[MAPA.TIPO_OPERACION] = document.getElementById('f1').value;
        registroTxt[MAPA.RFC] = rfcInput.value;
        
        registroTxt[MAPA.BASE_16] = bruto16.toString();
        registroTxt[MAPA.DTO_16] = dto16.toString();
        registroTxt[MAPA.BASE_8] = bruto8.toString();
        registroTxt[MAPA.DTO_8] = dto8.toString();
        registroTxt[MAPA.BASE_0] = document.getElementById('f48').value || "0";
        registroTxt[MAPA.BASE_EX] = document.getElementById('f50').value || "0";
        registroTxt[MAPA.RETENIDO] = ret.toString();

        if (acreditamiento === 'exclusivo') registroTxt[MAPA.IVA_EXCLUSIVO_16] = ivaCalculado.toString();
        else if (acreditamiento === 'proporcion') registroTxt[MAPA.IVA_PROPORCION_16] = ivaCalculado.toString();

        for (let i = 7; i < 53; i++) { if (registroTxt[i] === "") registroTxt[i] = "0"; }
        registroTxt[MAPA.EFECTOS_FISCALES] = "01";

        listaDIOT.push({
            textoFinal: registroTxt.join('|'), rfc: rfcInput.value,
            bruto: bruto16, dto: dto16, iva: (acreditamiento !== 'no_acreditable' ? ivaCalculado : 0), ret: ret
        });

        // Limpieza rápida
        ['f11','f12','f7','f8','f48','f50','f22'].forEach(id => document.getElementById(id).value = '0');
        document.getElementById('ivaVisual').value = '$0';
        errorBox.style.display = "none";
        
        const listaCuerpo = document.getElementById('listaCuerpo');
        listaCuerpo.innerHTML = '';
        listaDIOT.forEach((item, index) => {
            listaCuerpo.innerHTML += `<tr>
                <td>${item.rfc}</td><td>$${item.bruto}</td><td>-$${item.dto}</td>
                <td>$${item.iva}</td><td>$${item.ret}</td>
                <td><button onclick="eliminarFila(${index})">Eliminar</button></td>
            </tr>`;
        });
        document.getElementById('contador').textContent = listaDIOT.length;
        document.getElementById('btnDownloadMasivo').disabled = false;
        document.getElementById('f0').focus();
    });

    window.eliminarFila = function(index) {
        listaDIOT.splice(index, 1);
        document.getElementById('contador').textContent = listaDIOT.length;
        if(listaDIOT.length === 0) document.getElementById('btnDownloadMasivo').disabled = true;
        // Redibujar tabla omitiendo simulación de click
        const listaCuerpo = document.getElementById('listaCuerpo');
        listaCuerpo.innerHTML = '';
        listaDIOT.forEach((item, idx) => {
            listaCuerpo.innerHTML += `<tr>
                <td>${item.rfc}</td><td>$${item.bruto}</td><td>-$${item.dto}</td>
                <td>$${item.iva}</td><td>$${item.ret}</td>
                <td><button onclick="eliminarFila(${idx})">Eliminar</button></td>
            </tr>`;
        });
    };

    document.getElementById('btnDownloadMasivo').addEventListener('click', () => {
        const contenidoTxt = listaDIOT.map(item => item.textoFinal).join('\r\n');
        const blob = new Blob([contenidoTxt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `DIOT_CARGA_MASIVA.txt`;
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    });
});
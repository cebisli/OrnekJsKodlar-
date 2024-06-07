Tarih = { };
// Verlen tarihi tarih formatına dönüştürür.
Tarih.StrToDate = function (tarih)
{
	var part = tarih.split(" ");
	tarih = part[0];
	if (!tarih.match(/^[0-9]{1,2}\-[0-9]{1,2}\-[0-9]{4}$/))
		return null;
	var parts = tarih.split('-');

	// Baştaki "0"lar parseInt sırasında problem çıkarabiliyor
	if (parts[0].charAt(0) == '0')
		parts[0] = parts[0].charAt(1);
	if (parts[1].charAt(0) == '0')
		parts[1] = parts[1].charAt(1);
	if (parseInt(parts[1]) == 0 || parseInt(parts[0]) == 0)
		return -1;
	if (part.length == 2)
	{
		var saat = part[1];
		if (!saat.match(/^[0-9]{1,2}\:[0-9]{1,2}(\:[0-9]{1,2})?$/))
			return null;

		var zaman_part = saat.split(':');
		if (zaman_part[0].charAt(0) == '0')
			zaman_part[0] = zaman_part[0].charAt(1);
		if (zaman_part[1].charAt(0) == '0')
			zaman_part[1] = zaman_part[1].charAt(1);
		if (typeof zaman_part[2] == "undefined")
			zaman_part.push(0);
		else if (zaman_part[2].charAt(0) == '0')
			zaman_part[2] = zaman_part[2].charAt(1);
	}
	else
		zaman_part = [0, 0, 0];

	return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]),
			parseInt(zaman_part[0]), parseInt(zaman_part[1]), parseInt(zaman_part[2]));
};

// Girilen iki tarih arasındaki farkı verir
Tarih.DateDiff = function (tarih1, tarih2)
{
	if (typeof tarih1 == "string")
		tarih1 = Tarih.StrToDate(tarih1);
	if (typeof tarih2 == "string")
		tarih2 = Tarih.StrToDate(tarih2);
	var fark = (tarih2 - tarih1) / 1000.0;
	return parseInt(Math.ceil(fark / (60 * 60 * 24)));
};

// verilen tarihin üzerine belirtilen gün kadar ekleme yapar.
Tarih.DateAdd = function (tarih, gun, tur)
{
	if (typeof tarih == "string")
		tarih = Tarih.StrToDate(tarih);
	if (typeof tur == "undefined")
		tur = 1;
	gun = parseInt(gun);
	switch (tur)
	{
		case 30	:
			tarih.setMonth(tarih.getMonth() + gun);
			break;
		case 365:
			tarih.setFullYear(tarih.getFullYear() + gun);
			break;
		default:
			tarih.setDate(tarih.getDate() + gun);
	}
	return Tarih.DateToStr(tarih);
};

var Page = { };
// sayfayı yenileme işlemi yapar.
Page.Refresh = function (win) {
	if (typeof win != 'object' || typeof win.document != 'object')
		win = window;

	if (win.lastDataTableObj && ! win.lastDataTableObj.ShowPaging)
		return win.Page.Load(Page.UrlWithActiveTab(win));

	if (typeof win['RefreshPageFunc'] == 'function')
		return win['RefreshPageFunc']();

	if (win.Page)
		return win.Page.Load(Page.UrlWithActiveTab(win));
	win.location.reload();
};

// Sayfaları yeni pencerede açma işlemini yapar
Page.Open = function (pageStr, ext, win) {
	var page = JSON.TryParse(pageStr);
	if (!page)
		page = {U: pageStr, T: 0};
	if (typeof ext == 'string' && ext)
		ext = JSON.TryParse(ext, ext);
	if (typeof ext == 'object')
	{
		page = $.extend(page, ext);
		delete ext.T;
		delete ext.W;
		delete ext.H;
	}
	var url = GetUrl(page.U, page.T == 1 ? 'clear' : '', 0, ext);
	var evnt = window.event;
	if (evnt && evnt.ctrlKey)
		return window.open(url);
	if (evnt && evnt.shiftKey)
		return window.open(url, page.N);
	win = win || window;
	if (page.T == 1)
		win = Page.OpenNewWindow(url, page.N, page.W, page.H);
	else
		win.Page.Load(url);
	if (page.W == 'full' || page.W == 0)
		win.moveTo(0, 0);
	win.blur();
	win.focus();
	return win;
};

var Table = { };

/**
 * @param {string} tblSel
 * @param {string} templateOrCounts
 * @param {array} data
 * @param {function} callback
 * @param {int} rowIndex
 * @returns {TR}
 */
Table.AddNewRow = function (tblSel, templateOrCounts, data, callback, rowIndex)
{
	var templateSel = null;
	var cellCount = null;
	if (typeof templateOrCounts == "number")
		cellCount = templateOrCounts;
	else
		templateSel = templateOrCounts;

	var tbl = $(tblSel).find('TBODY').get(0);
	if (!is_set(rowIndex) || rowIndex === null)
		rowIndex = tbl.rows.length;
	var row = tbl.insertRow(rowIndex);
	if (templateSel)
	{
		var temp = $(templateSel);
		// İçerik
		$(row).html(temp.html());
		// Attributes
		var attrIgnoreList = ['style', 'class', 'id', 'new_class'];
		for (var i = 0; i < temp.get(0).attributes.length; i++)
		{
			var attr = temp.get(0).attributes[i];
			if ($.inArray(attr.name, attrIgnoreList) >= 0)
				continue;
			var val = attr.value;
			var match = val.match(/\$(.*)/i);
			if (match)
			{
				// Table.UpdateRow kısmında güncellenecek
				// o yüzden döngüde bir sonraki adıma atlıyoruz
				$(row).attr('_' + attr.name, val);
				continue;
			}
			$(row).attr(attr.name, val);
		}
		var cls = temp.get(0).getAttribute('new_class');
		if (cls)
			$(row).addClass(cls);
	} else
		for (var i = 0; i < cellCount; i++)
			row.insertCell(i);
	var rows = $(tbl).find("TR");
	for(var i=0; i<rows.length; i++)
		rows.eq(i).find('TD.SiraNo').html( i + 1);
	$(row).find(EmptyValSel('[id!=]')).removeAttr('id');
	$(row).find('.hasDatepicker').removeClass('hasDatepicker');
	Jui.InitInputs(row);
	// Veri
	if (is_set(data) && data)
		Table.UpdateRow(row, data);
	$(row).click(function(){
		var tbl = $(this).parents('TABLE').first();
		tbl.find('TR.selected-row')
			.removeClass('selected-row')
			.find('TD').css({backgroundColor: ''})
			.first()
			.css({border: ''});
		var border = '3px solid green';
		$(this).addClass('selected-row')
			.find('TD').css({backgroundColor: 'lightyellow'})
			.first()
			.css({borderLeft: border});
	});
	if (is_set(callback) && typeof callback == "function")
		callback(row);
	return row;
};

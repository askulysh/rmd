[-] файл бд размещаем сразу рядом, папок может быть несколько
сильно не заморачиваемся, потом все равно все на склайт переедет





// -----------------------------------
[+] узнаем duration сразу при добавлении
[+] добавляем вычисление хеша туда же

[-] хранение переделываем по ключу хеша
[-] сервер статики отдает файлы по хешу, try intercept


# Логика systray
[-] settings в базе
[-] при первой загрузке - Notification -> folder dialog
[-] add folder
[-] remove folder
[-] иконка для systray, windows

// ----------------------------------- потом
[-] проверь wav
[-] version из package.json на коннекте как-то, или в хидерах, или отдельным эндпоинтом (чтобы всегда можно было проверить)



// ----------------------------------- multi-folder
await startDB();

check settings->servers;

if 0 folders
notification->folder-dialog
set to db
addFolder(path)
notification-> Сканую наявні файли
scan > addWatcher() > get meta > add to db without checking

if >= 1
notification-> Пошук змін в файлах
each: scan > addWatcher() > find in db by path+size+time
> if not equal or not found, getMeta, overwrite
> if equal, skip

open WS
notification-> Все готово, взлітаємо

onFileAdded (path, stat) => get meta, rewrite in database, ws.emit FILE_ADDED

addWatcher(path)
createWatcher(path)

systray.on('add') -> {
check if its not enclosed folder for existing
folder-dialog, addFolder
}
systray.on('remove') ->
unwatch
remove settings.server in database
remove files in database
ws.emit(FILE_REMOVE)


// -----------------------------------

WS
connect
FETCH_DATE
MARK_LISTENED
emit > update file > ws.emit FILE_CHANGED
MARK_UNLISTENED
emit > update file > ws.emit FILE_CHANGED




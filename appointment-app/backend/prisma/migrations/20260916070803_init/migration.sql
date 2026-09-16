-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "preferred_timezone" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointment_invitees" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "appointment_invitees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE INDEX "appointments_creator_id_idx" ON "appointments"("creator_id");

-- CreateIndex
CREATE INDEX "appointments_start_idx" ON "appointments"("start");

-- CreateIndex
CREATE INDEX "appointment_invitees_user_id_idx" ON "appointment_invitees"("user_id");

-- CreateIndex
CREATE INDEX "appointment_invitees_appointment_id_idx" ON "appointment_invitees"("appointment_id");

-- CreateIndex
CREATE UNIQUE INDEX "appointment_invitees_appointment_id_user_id_key" ON "appointment_invitees"("appointment_id", "user_id");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_invitees" ADD CONSTRAINT "appointment_invitees_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointment_invitees" ADD CONSTRAINT "appointment_invitees_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
